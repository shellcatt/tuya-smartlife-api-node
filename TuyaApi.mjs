import fetch from 'node-fetch';
import { format } from 'util';

import { getTuyaDevice } from './devices/factory.mjs'

const DEFAULTREGION = 'eu';
const TUYACLOUDURL = 'https://px1.tuya%s.com';

const REFRESHTIME = 60 * 60 * 12; // 12 hours
const REDISCOVERTIME = 60 * 17; // 17 min

class TuyaSession {

  constructor(auth) {
    if (auth.username && auth.password) {
      this.username = auth.username;
      this.password = auth.password;
      this.countryCode = auth.countryCode;
      this.bizType = auth.bizType;
      this.devices = [];
    } 
    else if (auth.accessToken && auth.refreshToken) {
      this.accessToken = auth.accessToken;
      this.refreshToken = auth.refreshToken;
      this.expireTime = auth.expireTime || 0;
      this.devices = auth.devices;
    } else {
      throw new TuyaAPIException('Credentials not supplied.');
    }
    
    this.lastUpdate = auth.lastUpdate || 0;
    this.region = DEFAULTREGION;
    this.cloudUrl = format(TUYACLOUDURL, this.region);
  }

  
  async getAccessToken() {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const body = {
      userName: this.username,
      password: this.password,
      countryCode: this.countryCode,
      bizType: this.bizType,
      from: 'tuya',
    };
    console.log(`${this.cloudUrl}/homeassistant/auth.do`, {body});

    let response = await fetch(`${this.cloudUrl}/homeassistant/auth.do`, {
      method: 'POST',
      headers,
      // body: JSON.stringify(body),
      body: new URLSearchParams(Object.entries(body)).toString(),
    });

    const responseJson = await response.json();

    if (responseJson.responseStatus === 'error') {
      const message = responseJson.errorMsg;

      if (message === 'error') {
        throw new TuyaAPIException('get access token failed?');
      } else {
        throw new TuyaAPIException(message);
      }
    }
    const NOW = Math.floor(Date.now() / 1000);
    this.accessToken = responseJson.access_token;
    this.refreshToken = responseJson.refresh_token;
    this.expireTime = NOW + responseJson.expires_in;
    this.lastUpdate = NOW;

    const areaCode = this.accessToken.substring(0, 2);
    if (areaCode === 'AY') {
      this.region = 'cn';
    } else if (areaCode === 'EU') {
      this.region = 'eu';
    } else {
      this.region = 'us';
    }
  }
  
  async refreshAccessToken() {
    const data = `grant_type=refresh_token&refresh_token=${this.refreshToken}`;
    const response = await fetch(`${this.cloudUrl}/homeassistant/access.do?${data}`);
    const responseJson = await response.json();

    if (responseJson.responseStatus === 'error') {
      throw new TuyaAPIException('refresh token failed');
    }

    this.accessToken = responseJson.access_token;
    this.refreshToken = responseJson.refresh_token;
    this.expireTime = Math.floor(Date.now() / 1000) + responseJson.expires_in;
  }

  async checkAccessToken() {
    if (!this.accessToken || !this.refreshToken) {
      if (!this.username || !this.password) {
        throw new TuyaAPIException('Missing Username or Password.');
      }
      await this.getAccessToken();
    } else if (this.expireTime <= REFRESHTIME + Math.floor(Date.now() / 1000)) {
      await this.refreshAccessToken();
    }
  }

  toJSON() {
    return {
      region: this.region,
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expireTime: this.expireTime,
      lastUpdate: this.lastUpdate,
      devices: this.devices,
    };
  }
}

export class TuyaApi {
  session;

  constructor() {}
  
  async init(username, password, countryCode, bizType = 'smart_life') {
    this.session = new TuyaSession({ username, password, countryCode, bizType });
    await this.session.getAccessToken();
    try {
      await this.discoverDevices();
    } catch (e) {
      console.error(e);
    }
    
  }

  async discoverDevices() {
    const NOW = Math.floor(Date.now() / 1000);
    if (this.session.lastUpdate + REDISCOVERTIME <= NOW) {
      const response = await this.request('Discovery', 'discovery');
  
      if (response.header.code == 'SUCCESS') {
        this.session.devices = response.payload.devices.map(device => 
          getTuyaDevice(device, this)
        );
        this.session.lastUpdate = NOW;
      } else {
        throw new TuyaAPIException(response.header.code);
      }
    } else {
      console.debug('Debug: Too soon to rediscover devices, skipping.');
    }
  }

  async load(cache) {
    this.session = new TuyaSession({ ...cache });
    await this.session.checkAccessToken();
    this.session.devices = cache.devices.map((device) => 
      getTuyaDevice(device, this)
    );
  }

  async pollDevicesUpdate() {
    await this.session.checkAccessToken();
    return await this.discoverDevices();
  }

  getAllDevices() {
    return this.session.devices;
  }

  getDeviceById(devId) {
    return this.session.devices.find((device) => device.objectId() === devId);
  }

  getDevicesByType(devType) {
    return this.session.devices.filter((device) => device.devType() === devType);
  }

  getDeviceByName(devName) {
    return this.session.devices.find((device) => device.name().includes(devName));
  }

  async deviceControl(devId, action, param = null, namespace = 'control') {
    if (param === null) {
      param = {};
    }

    const response = await this.request(action, namespace, devId, param);

    const success = response.header.code === 'SUCCESS';
    return [success, response];
  }

  async request(name, namespace, devId = null, payload = {}) {
    const headers = {
      'Content-Type': 'application/json',
    };

    const header = {
      name,
      namespace,
      payloadVersion: 1,
    };

    payload.accessToken = this.session.accessToken;

    if (namespace !== 'discovery') {
      payload.devId = devId;
    }

    const data = {
      header,
      payload,
    };

    const response = await fetch(`${this.session.cloudUrl}/homeassistant/skill`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const responseJson = await response.json();

    if (responseJson.header.code !== 'SUCCESS') {
      console.debug(`control device error, error code is ${responseJson.header.code}`);
    }

    return responseJson;
  }
}

export class TuyaAPIException extends Error {}

