import fetch from 'node-fetch';
import { format } from 'util';
import initDebug from 'debug';
const debug = initDebug('api');

import { getTuyaDevice } from './devices/factory.mjs'

const DEFAULTREGION = 'eu';
const TUYACLOUDURL = 'https://px1.tuya%s.com';

// In seconds !
export const REFRESH_RATE = 30; 
export const REACCESS_RATE = 60 * 3; 
export const REDISCOVER_RATE = 60 * 17; 

class SmartLifeSession {

  constructor(auth) {
    debug('SmartLifeSession.constructor', { auth });
    if (auth.username && auth.password) {
      this.username = auth.username;
      this.password = auth.password;
      this.countryCode = auth.countryCode;
      this.bizType = auth.bizType;
      this.devices = [];
    } 
    else if (auth.accessToken && auth.refreshToken) {
      this.accessToken = auth.accessToken;
      this.expireTime = auth.expireTime || 0;
      this.refreshToken = auth.refreshToken;
      this.refreshTime = 0; //NOW + REFRESH_RATE;
      this.devices = auth.devices;
    } else {
      throw new TuyaSmartLifeException('Credentials not supplied.');
    }
    
    // this.lastAuth = auth.lastAuth || 0;
    this.lastUpdate = auth.lastUpdate || 0;
    this.region = auth.region || DEFAULTREGION;
    this.cloudUrl = format(TUYACLOUDURL, this.region).toLowerCase();
  }

  
  async getAccessToken() {
    debug('SmartLifeSession.getAccessToken()');
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
    // console.log('getAccessToken', `${this.cloudUrl}/homeassistant/auth.do`, {body}, new Date());

    const response = await fetch(`${this.cloudUrl}/homeassistant/auth.do`, {
      method: 'POST',
      headers,
      // body: JSON.stringify(body),
      body: new URLSearchParams(Object.entries(body)).toString(),
    });

    const responseJson = await response.json();

    if (responseJson.responseStatus === 'error') {
      const message = responseJson.errorMsg;

      if (message === 'error') {
        throw new TuyaSmartLifeException('get access token failed?');
      } else {
        throw new TuyaSmartLifeException(message);
      }
    }
    const NOW = Math.floor(Date.now() / 1000);
    this.accessToken = responseJson.access_token;
    this.expireTime = NOW + responseJson.expires_in;
    // this.lastAuth = NOW;
    this.refreshToken = responseJson.refresh_token;
    // this.refreshTime = NOW + REFRESH_RATE;

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
    debug('SmartLifeSession.refreshAccessToken()');
    const data = `grant_type=refresh_token&refresh_token=${this.refreshToken}`;
    const response = await fetch(`${this.cloudUrl}/homeassistant/access.do?${data}`);
    const responseJson = await response.json();

    if (responseJson.responseStatus === 'error') {
      throw new TuyaSmartLifeException('refresh token failed');
    }

    const NOW = Math.floor(Date.now() / 1000);

    this.accessToken = responseJson.access_token;
    this.expireTime = NOW + responseJson.expires_in;
    // this.lastAuth = NOW;
    this.refreshToken = responseJson.refresh_token;
    this.refreshTime = NOW + REFRESH_RATE;
  }

  async checkAccessToken() {
    debug('SmartLifeSession.checkAccessToken()')
    const NOW = Math.floor(Date.now() / 1000);
    // If first try, or access token expired
    if (!this.accessToken || !this.refreshToken) {
      if (!this.username || !this.password) {
        throw new TuyaSmartLifeException('Missing Username or Password.');
      }
      await this.getAccessToken();
    }
    // If refresh token expired, but accessToken hasn't 
    else if (this.refreshToken && this.refreshTime < NOW && NOW < this.expireTime) {
      await this.refreshAccessToken();
    }
    // If refresh token hasn't expired 
    else if (this.refreshToken && this.refreshTime > NOW) {
      debug('Refresh token hasn\'t expired yet, skipping.');
      debug(`Expires in ${new Date(this.refreshTime*1000)}`)
    } 
    else {
      throw new TuyaSmartLifeException('Refresh token missing?');
    }
  }

  toJSON() {
    return {
      region: this.region,
      accessToken: this.accessToken,
      expireTime: this.expireTime,
      refreshToken: this.refreshToken,
      refreshTime: this.refreshTime,
      // lastAuth: this.lastAuth,
      lastUpdate: this.lastUpdate,
      devices: this.devices,
    };
  }
}

export class TuyaSmartLifeClient {
  session;

  constructor() {}
  
  async init(username, password, countryCode, region = DEFAULTREGION, bizType = 'smart_life') {
    debug('TuyaSmartLifeClient.init()')
    this.session = new SmartLifeSession({ username, password, countryCode, region, bizType });
    await this.session.getAccessToken();
    try {
      await this.discoverDevices();
    } catch (e) {
      console.error(e);
    }    
  }

  async load(cache) {
    debug('TuyaSmartLifeClient.load()')
    this.session = new SmartLifeSession({ ...cache });
    await this.session.checkAccessToken();
    this.session.devices = cache.devices.map((device) => 
      getTuyaDevice(device, this)
    );
  }



  async discoverDevices() {
    debug('TuyaSmartLifeClient.discoverDevices()')
    const NOW = Math.floor(Date.now() / 1000);

    if (!this.session?.lastUpdate || this.session?.lastUpdate + REFRESH_RATE < NOW) {
      const response = await this.request('Discovery', 'discovery');

      if (response.header.code == 'SUCCESS') {
        this.session.devices = response.payload.devices.map(device => 
          getTuyaDevice(device, this)
        );
        debug('Discovery SUCCESS')
        this.session.lastUpdate = NOW;
        this.session.refreshTime = NOW + REFRESH_RATE;
      } else if (response.header.code == 'FrequentlyInvoke') {
        debug(`Rate limited until ${this.session.lastUpdate + REDISCOVER_RATE}`);
      } else {
        throw new TuyaSmartLifeException(response.header.code);
      }
    } else {
      debug('Debug: Too soon to rediscover devices, skipping.');
      // console.log(this.session.lastUpdate, REFRESH_RATE, NOW, this.session.refreshTime);
    }
    return this.session.devices;
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
      'Cache-control': 'no-cache',
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
      debug(`request '${name}' error`, responseJson);
    }

    return responseJson;
  }
}

export class TuyaSmartLifeException extends Error {}

