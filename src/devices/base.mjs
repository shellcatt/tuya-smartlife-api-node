const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class TuyaDevice {
  constructor(data, api) {
    this.api = api;
    this.data = data.data;
    this.objId = data.id;
    this.objType = data.ha_type;
    this.objName = data.name;
    this.devType = data.dev_type;
    this.icon = data.icon;
    /* 
     * Make the `api` rather "protected"
     */
    Object.defineProperty(this, 'api', {
      value: api,
      enumerable: false
    });
  }
  
  toJSON() {
    return {
      data: this.data,
      id: this.objId,
      ha_type: this.objType,
      name: this.objName,
      dev_type: this.devType,
      icon: this.icon,
    };
  }
  

  name() {
    return this.objName;
  }

  state() {
    const state = this.data.state;
    return state === 'true';
  }

  deviceType() {
    return this.devType;
  }

  objectId() {
    return this.objId;
  }

  objectType() {
    return this.objType;
  }

  available() {
    return this.data.online;
  }

  iconUrl() {
    return this.icon;
  }

  async update() {
    await sleep(500);
    const [success, response] = await this.api.deviceControl(
      this.objId, 'QueryDevice', { namespace: 'query' }
    );

    if (success) {
      this.data = response.payload.data;
      return true;
    }

    return false;
  }
}
