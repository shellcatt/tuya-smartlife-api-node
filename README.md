# Tuya HomeAssistant API (NodeJS)

> Inspired by [TuyaPy](https://pypi.org/project/tuyapy/) (backend) and [SmartLife](https://github.com/ndg63276/smartlife) (web) interfaces to [Tuya](https://tuya.com/)'s **[SmartAtHome](https://smartathome.co.uk/smartlife/)** for IoT smart device control.

## Install & Run tests
- create a `.env` file (see `.env.example`)
- run `npm test` (or `yarn run test`)

## TODO 
- [x] port and optimize [TuyaPy](https://pypi.org/project/tuyapy/)
- [ ] implement CLI (see [Examples](#examples))
- [ ] implement classes for other IoT devices (climate, fann, lock, etc.)
- [ ] implement REST service
- [ ] implement TUI (blessed-contrib)


## Examples 

```bash

# List all devices
tuya --list

# Turn device ID on / off
tuya --device <ID> --state 1
tuya --device <ID> --state 0
tuya --device <ID> --toggle

# Set light brightness
tuya --device <ID> --brigntness 30

# Set light color temp
tuya --device <ID> --temperature 3500

# Set light color
tuya --device <ID> -h 78.34 -s 1 -b 100 

```