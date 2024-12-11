import { TuyaDevice } from './base';

export class TuyaScene extends TuyaDevice {
    available() {
      return true;
    }
  
    async activate() {
      let res = await this.api.deviceControl(this.objId, 'turnOnOff', { value: '1' });
    }
  
    update() {
      return true;
    }
  }