# Tuya Smart Life API + CLI 

![Tests](https://github.com/shellcatt/tuya-smartlife-api-node/actions/workflows/main.yml/badge.svg?branch=main) ![Releases](https://github.com/shellcatt/tuya-smartlife-api-node/actions/workflows/release.yml/badge.svg)

## Usage  [![requirements](https://img.shields.io/badge/requires-NodeJS-blue?logo=nodedotjs)](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

<details x-open>
	<summary> <strong> Module </strong> </summary>

- install package **locally** 
```bash
npm install -S tuya-smartlife-api
```


- import module (ESM or CJS)
```javascript
/* ESM */
import { TuyaSmartLifeClient } from "tuya-smartlife-api";
/* CommonJS */
// const TuyaSmartLifeClient = require("tuya-smartlife-api").TuyaSmartLifeClient;

const client = new TuyaSmartLifeClient();
try {
	await client.init('jondoe@example.co.uk', 'password', 'eu');
	await client.discoverDevices();

	const tDevices = client.getAllDevices();
	console.log(tDevices);

	const myLightBulbs = await client.getDevicesByType('light');
	await myLightBulbs[0].turnOn();

} catch (e) {
	console.error('Failed because', e);
}
```

> Note: Consider using an `.env` file with [dotenv](https://www.npmjs.com/package/dotenv). 

> Note: check your [Tuya region](https://github.com/tuya/tuya-home-assistant/blob/main/docs/regions_dataCenters.md). 

</details>

<details open>
<summary> <strong> Standalone </strong> </summary>

- install package **globally**
```bash
npm install -g tuya-smartlife-api
```

- verify installation  
```bash
tuyacli
```
```
Usage: tuyacli [options] [command]

Options:
  -V, --version                   output the version number
  -h, --help                      display help for command

Commands:
  auth                            login with SmartLife
  test                            live test a selected device's functions set
  list [options]                  list devices and their state / attributes
  control [options] <name-or-id>  control a device's state
  help                            output usage information
```

</details>


## Examples 

```bash

# Authenticate /will be automatically called later if skipped the first time/
tuyacli auth

# List all devices
tuyacli list [--format={short|long}]

# Perform interactiv device tests
tuyacli test 

# Turn device ID on / off
tuyacli control <ID|Name> --state [1|on]
tuyacli control <ID|Name> --state [0|off]
tuyacli control <ID|Name> --toggle

# Set light brightness, color temp & color 
tuyacli control <ID|Name> --brightness 30 
tuyacli control <ID|Name> --temperature 3500 # set warm temp
tuyacli control <ID|Name> --hsl 78.34,1,100 # HSL chill green
tuyacli control <ID|Name> --hsl 324.77,1,42 # HSL chill purple
tuyacli control <ID|Name> --rgb 90,30,115 # RGB something
```

> Note: Use `node tuyacli` in module's root folder if not installed globally.

> Note: The `<ID|Name>` portion is treated as a **filtering pattern** rather than a full identifier. Conviniently, `tuyacli control bulb -s off` would turn off all devices with the pattern "bulb" in their names, but use with caution. 
_`ID` would be used for large setups, where `Name` is not applicable._


---
## Tests

<details x-open>
<summary> <strong> Unit tests </strong> </summary>

```bash
npm test
```

</details>

<details x-open>
	<summary> <strong> Interactive tests  </strong> </summary>

```bash
tuyacli test
```

> Note: Use `node tuyacli` in module's root folder if not installed globally.


</details>
<br>

> Note: Tests might fail if attempted multiple times before [`LOGIN_INTERVAL`](./.env.example) seconds have passed since last run.


---
### Roadmap 

- [x] port and optimize [TuyaPy](https://pypi.org/project/tuyapy/)
- [x] implement integration tests
- [x] implement pure CLI 
  - [x] list devices (short / long format)
  - [x] control a device's state
  - [x] control a device's custom attributes
- [x] use [Configstore](https://www.npmjs.com/package/configstore) for credentials & device cache _(not `session.json`)_
  - [ ] encrypt credentials at rest 
- [x] implement unit tests
- [x] add support for CommonJS
- [ ] document code & generate JSDoc
- [ ] dockerize
- [ ] implement classes for other IoT devices (climate, fan, lock, etc.)
- [ ] [~~implement TUI with blessed-contrib~~](https://github.com/shellcatt/smartlife-tui)

---
## Credits ![License](https://img.shields.io/badge/license-MIT-73901d)

> Inspired by [TuyaPy](https://pypi.org/project/tuyapy/) (backend) and [SmartLife](https://github.com/ndg63276/smartlife) (web) interfaces to [Tuya](https://tuya.com/)'s **[SmartAtHome](https://smartathome.co.uk/smartlife/)** for IoT smart device control. 



#### See also 
 - [CloudTuya](https://github.com/unparagoned/cloudtuya)
 - [TuyaCloudPHP](https://github.com/Aymkdn/tuyacloud-php)
 - [TuyaAPI CLI](https://github.com/TuyaAPI/cli)
