import { TuyaDevice } from './base.mjs';

const MIN_COLOR_TEMP = 1000;
const MAX_COLOR_TEMP = 10000;

export class TuyaLight extends TuyaDevice {

  state() {
    return this.data.state == 'true'; //HACK: original value is string
  }

  async turnOn() {
    let res = await this.api.deviceControl(this.objectId(), 'turnOnOff', { value: '1' });
    if (res[0]) {
      this.data.state = 'true';
    }
  }

  async turnOff() {
    let res = await this.api.deviceControl(this.objectId(), 'turnOnOff', { value: '0' });
    if (res[0]) {
      this.data.state = 'false';
    }
  }

  async toggle() {
    if (this.state()) 
      await this.turnOff();
    else
      await this.turnOn();
  }

  brightness() {
    const workMode = this.data.color_mode;
    if (workMode === 'colour' && this.data.color) {
      const color = this.data.color;
      return Math.round((color.brightness * 255) / 100);
    } else {
      return this.data.brightness;
    }
  }

  _setBrightness(brightness) {
    const workMode = this.data.color_mode;
    if (workMode === 'colour') {
      this.data.color.brightness = brightness;
    } else {
      this.data.brightness = brightness;
    }
  }

  
  supportColor() {
    return this.data.color !== null;
  }

  supportColorTemp() {
    return this.data.color_temp !== null;
  }

  hsColor() {
    if (this.data.color) {
      const workMode = this.data.color_mode;
      if (workMode === 'colour') {
        const color = this.data.color;
        return [color.hue, color.saturation];
      } else {
        return [0.0, 0.0];
      }
    } 
    return null;
  }

  colorTemp() {
    return this.data.color_temp;
  }

  async setBrightness(brightness) {
    const value = Math.round((brightness * 100) / 255);
    let res = this.api.deviceControl(this.objectId(), 'brightnessSet', { value });
    if (res[0]) {
      this.data.brightness = value;
    }
  }

  async setColor(hsbColor) {
    let res = await this.api.deviceControl(this.objectId(), 'colorSet', { color: hsbColor });
    if (res[0]) {
      this.data.color = hsbColor;
    }
  }

  async setColorTemp(colorTemp) {
    if (colorTemp >= MIN_COLOR_TEMP && colorTemp <= MAX_COLOR_TEMP) {
      let res = await this.api.deviceControl(this.objectId(), 'colorTemperatureSet', { value: colorTemp });
      if (res[0]) {
        this.data.color_temp = colorTemp;
      }
    } else {
      console.error('Color temp value out of range.')
    }
  }
}

