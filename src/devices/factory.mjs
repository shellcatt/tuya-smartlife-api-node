import { TuyaLight } from './light';
import { TuyaSwitch } from './switch';
// import { TuyaClimate } from './climate.mjs';
// import { TuyaScene } from './scene.mjs';
// import { TuyaFanDevice } from './fan.mjs';
// import { TuyaCover } from './cover.mjs';
// import { TuyaLock } from './lock.mjs';

export function getTuyaDevice(data, api) {
  switch (data.dev_type) {
    case 'light':
      return new TuyaLight(data, api);
      break;
    case 'switch':
        return new TuyaSwitch(data, api);
        break;
    // case 'scene':
    //   devices.push(new TuyaScene(data, api));
    //   break;
    // case 'climate':
    //   devices.push(new TuyaClimate(data, api));
    //   break;
    // case 'fan':
    //   devices.push(new TuyaFanDevice(data, api));
    //   break;
    // case 'cover':
    //   devices.push(new TuyaCover(data, api));
    //   break;
    // case 'lock':
    //   devices.push(new TuyaLock(data, api));
    //   break;
    
    default:
      let e = `Unknown device type: ${data.dev_type}`;
      throw new Error(e);
  }

}
