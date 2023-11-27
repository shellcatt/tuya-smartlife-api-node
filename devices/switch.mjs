import { TuyaDevice } from './base.mjs';

export class TuyaSwitch extends TuyaDevice {
  state() {
    return this.data.state == true; //HACK: original value MAY be string
  }

  async turnOn() {
    let res = this.api.deviceControl(this.objectId, 'turnOnOff', { value: '1' });
    if (res[0]) {
      this.data.state = true;
    }
  }

  async turnOff() {
    let res = await this.api.deviceControl(this.objectId, 'turnOnOff', { value: '0' });
    if (res[0]) {
      this.data.state = false;
    }
  }
}
