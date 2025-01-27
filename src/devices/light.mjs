import { TuyaDevice } from './base';

const MIN_COLOR_TEMP = 1000;
const MAX_COLOR_TEMP = 10000;

export class TuyaLight extends TuyaDevice {

  state() {
    return ['true', true].includes(this.data.state); //HACK: original value is string
  }

  async turnOn() {
    let res = await this.api.deviceControl(this.objectId(), 'turnOnOff', { value: '1' });
    if (res[0]) {
      this.data.state = 'true';
    } else {
      console.error('could not turn on');
      console.debug(res[1]);
    }
  }

  async turnOff() {
    let res = await this.api.deviceControl(this.objectId(), 'turnOnOff', { value: '0' });
    if (res[0]) {
      this.data.state = 'false';
    } else {
      console.error('could not turn off');
      console.debug(res[1]);
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
      return Math.round((parseInt(color.brightness) * 255) / 100);
    } else {
      return parseInt(this.data.brightness);
    }
  }
  
  supportColor() {
    return !!this.data.color;
  }

  supportColorTemp() {
    return !!this.data.color_temp;
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
    const value = parseInt(brightness)
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

  async setColorRGB(rgbColor) {
    let hC = rgb2hsv([rgbColor.red, rgbColor.green, rgbColor.blue]);
    this.setColor({ hue: hC['h'], saturation: hC['s'], brightness: hC['v'] });
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


function rgb2hsv(rgb) {
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
  
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
  
	let h, s, v = max;
  
	const d = max - min;
	s = max === 0 ? 0 : d / max;
  
	if (max === min) {
		h = 0; // achromatic (gray)
	} else {
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
  
	return {
		h: Math.round(h * 360),
		s: Math.round(s),
		v: Math.round(v * 100)
	};
}