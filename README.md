# Tuya Smart Life API (NodeJS)

## Usage 

<details>
<summary> <strong> Standalone </strong> </summary>

- install modules with `npm install`
- create a `.env` file (see `.env.example`)
- run tests with `npm test`

</details>

<details open>
	<summary> <strong> Module </strong> </summary>

- install NPM package 
```bash
npm install @shellcatt/tuya-smartlife-api
```

- import ESM
> See [test.js](./test.js)

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
- [ ] use [Configstore](https://www.npmjs.com/package/configstore) for credentials & device cache _(not `session.json`)_
- [ ] implement unit tests
- [ ] implement classes for other IoT devices (climate, fan, lock, etc.)
- [x] [~~implement TUI (blessed-contrib)~~](https://github.com/shellcatt/smartlife-tui)

## Examples 

```bash

# List all devices
node cli list [--format={short|long}]

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


## Credits

> Inspired by [TuyaPy](https://pypi.org/project/tuyapy/) (backend) and [SmartLife](https://github.com/ndg63276/smartlife) (web) interfaces to [Tuya](https://tuya.com/)'s **[SmartAtHome](https://smartathome.co.uk/smartlife/)** for IoT smart device control. 

#### See also 
 - [CloudTuya](https://github.com/unparagoned/cloudtuya)
 - [TuyaCloudPHP](https://github.com/Aymkdn/tuyacloud-php)
 - [TuyaAPI CLI](https://github.com/TuyaAPI/cli)
