# Tuya Smart Life API (NodeJS) 

![Tests](https://github.com/shellcatt/tuya-smartlife-api-node/actions/workflows/main.yml/badge.svg?branch=main)


## Usage 

<details>
<summary> <strong> Standalone </strong> </summary>

- install global module with `npm install -g tuya-smartlife-api`
- verify installation with `tuyacli --version`

</details>

<details open>
	<summary> <strong> Module </strong> </summary>

- install NPM package 
```bash
npm install @shellcatt/tuya-smartlife-api
```
- run unit tests with `npm test`
- run live tests with `node cli live`

- import ESM

```javascript
import { TuyaSmartLifeClient } from "tuya-smartlife-api";
const client = new TuyaSmartLifeClient();
try {
	await client.init('jondoe@example.co.uk', 'password', '44');
	await client.discoverDevices();

	tDevices = client.getAllDevices();
	console.log(tDevices);
} catch (e) {
	console.error('Failed because', e);
}
```

</details>

## TODO 

- [x] port and optimize [TuyaPy](https://pypi.org/project/tuyapy/)
- [x] implement integration tests
- [x] implement pure CLI (see [Examples](#examples))
  - [x] list devices (short / long format)
  - [x] control a device's state
  - [x] control a device's custom attributes
- [x] use [Configstore](https://www.npmjs.com/package/configstore) for credentials & device cache _(not `session.json`)_
- [x] implement unit tests
- [ ] implement classes for other IoT devices (climate, fan, lock, etc.)
- [ ] [~~implement TUI with blessed-contrib~~](https://github.com/shellcatt/smartlife-tui)

## Examples 

```bash

# Authenticate /will be automatically called later if skipped the first time/
node cli auth

# List all devices
node cli list [--format={short|long}]

# Perform interactiv device tests
node cli test 

# Turn device ID on / off
node cli control <ID|Name> --state [1|on]
node cli control <ID|Name> --state [0|off]
node cli control <ID|Name> --toggle

# Set light brightness, color temp & color 
node cli control <ID|Name> --brigntness 30 
node cli control <ID|Name> --temperature 3500 # set warm temp
node cli control <ID|Name> --hsv 78.34,1,100 # HSV chill green
node cli control <ID|Name> --hsv 324.77,1,42 # HSV chill purple
node cli control <ID|Name> --rgb 90,30,115 # RGB something
```


> Note: The `<ID|Name>` portion is treated as a **filtering pattern** rather than a full identifier. Conviniently, `node cli control bulb -s off` would turn off all devices with the pattern "bulb" in their name, but use with caution. 
_`ID` would be used for large setups, where `Name` is not viable._

## Credits

> Inspired by [TuyaPy](https://pypi.org/project/tuyapy/) (backend) and [SmartLife](https://github.com/ndg63276/smartlife) (web) interfaces to [Tuya](https://tuya.com/)'s **[SmartAtHome](https://smartathome.co.uk/smartlife/)** for IoT smart device control. 

#### See also 
 - [CloudTuya](https://github.com/unparagoned/cloudtuya)
 - [TuyaCloudPHP](https://github.com/Aymkdn/tuyacloud-php)
 - [TuyaAPI CLI](https://github.com/TuyaAPI/cli)
