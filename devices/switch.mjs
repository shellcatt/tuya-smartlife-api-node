import { TuyaDevice } from './base.mjs';

export class TuyaSwitch extends TuyaDevice {
  state() {
    return ['true', true].includes(this.data.state); //HACK: original value is string
  }

  async turnOn() {
    let res = await this.api.deviceControl(this.objectId(), 'turnOnOff', { value: '1' });
    if (res[0]) {
      this.data.state = true;
    } else {
      console.error('could not turn on');
      console.debug(res);
    }
  }

  async turnOff() {
    let res = await this.api.deviceControl(this.objectId(), 'turnOnOff', { value: '0' });
    if (res[0]) {
      this.data.state = false;
    } else {
      console.error('could not turn on');
      console.debug(res[1]);
    }
  }

  async toggle() {
    if (this.state()) 
      await this.turnOff();
    else
      await this.turnOn();
  }
}
