#!/usr/bin/env node

import {
	TuyaSmartLifeClient, 
	settings as TuyaDefaults, 
	authStoreId,
	sessionStoreId,
	version,
	tuyaHA_asciiArt
} from './index';

import { program } from 'commander';
import Configstore from 'configstore';
import input from '@inquirer/input';
import password from '@inquirer/password';
import select from '@inquirer/select';
import Table from 'cli-table3';

import { promisify } from 'node:util';
import colors from '@colors/colors';
colors.enable();

import { log } from 'node:console';
import initDebug from 'debug';
const debug = initDebug('cli');

const authConfigStore = new Configstore(authStoreId);
const sessionStore = new Configstore(sessionStoreId);

const client = new TuyaSmartLifeClient();


const cbInterrupt = () => {
	log('Ok then.');
	process.exit(0);
};

async function auth() {
	const config = {};
	config['HA_EMAIL'] = await input({ message: 'Login email', required: true }).catch(cbInterrupt);
	config['HA_PASS'] = await password({ message: 'Login password', required: true }).catch(cbInterrupt);
	config['HA_REGION'] = await select({
            message: 'Region',
            choices: [
                { name: 'eu', value: 'eu' },
                { name: 'us', value: 'us' },
                { name: 'cn', value: 'cn' } // do we really?
            ],
            default: TuyaDefaults.REGION, 
        }).catch(cbInterrupt);
	config['HA_CC'] = await input({ message: 'Contry code', required: true, default: TuyaDefaults.COUNTRYCODES[config['HA_REGION']] }).catch(cbInterrupt);

	try {
		await client.init(config.HA_EMAIL, config.HA_PASS, config.HA_REGION, config.HA_CC);
	} catch (e) {
		console.error('Error: Could not login with Tuya.', e.message);
        process.exit(1);
	}
	
	authConfigStore.set('auth', config);
	authConfigStore.set('lastLogin', Math.floor(Date.now()/1000));
}

async function init() {
	try {
		if (!authConfigStore.has('auth')) {
			await auth();
		} else if (!sessionStore.has('session.accessToken')) {
			let auth = authConfigStore.get('auth');
            await client.init(auth.HA_EMAIL, auth.HA_PASS, auth.HA_REGION, auth.HA_CC);
        } else {
            await client.load(sessionStore.get('session'));
        }
		await client.pollDevicesUpdate();
    } catch (e) {
        console.error('Error: Could not init Smart Life CLI.', e);
		process.exit(1);
    }
}

function finish() {
	debug(`Finished, storing session`);
	try {
		sessionStore.set('session', client.session);
    } catch (e) {
        console.error('Error: Could not save Tuya session cache.', e);
    }
}

function renderTable({ head, rows, widths }) {
	const table = new Table({
		head: head.map(hCell => hCell.brightBlue.reset)
		, chars: {
			'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
			, 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
			, 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
			, 'right': '' , 'right-mid': '' , 'middle': ''
		}
		, style: { 
			'padding-left': 0, 'padding-right': 0,
			head: [], 
			border: []
		}
		, colWidths: widths
	});

	for (const row of rows) {	
		table.push(row);
	}

	return (table.toString());
}

program
	.command('auth')
	.description('login with SmartLife')
	.action(async (opts) => {
		if (authConfigStore.has('auth')) {
			const answer = await select({
				message: 'Re-enter existing credentitals?',
				choices: [
					{ name: 'yes', value: 'yes' },
					{ name: 'no', value: 'no' }
				],
				default: 'no'
			});
			if (answer == 'no') 
				return;
		}
		await auth();
	});

program
	.command('test')
	.description('live test a selected device\'s functions set')
	.action(async () => {
		const sleep = promisify(setTimeout);

		let tDevices, tBulb, tSwitch;

		log(tuyaHA_asciiArt);
		await sleep(500);

        log('Check authentication or existing session...');
		await init();

		log('-----');
		await sleep(500);
		try {
			log('Fetch device list...');
			tDevices = client.getAllDevices();

			if (!tDevices.length) {
				log('No devices found.');
				return;
			}

			const answer = await select({
				message: 'View result?',
				choices: [
					{
						name: 'yes',
						value: 'yes',
						description: 'Print JSON and continue'
					},
					{
						name: 'no',
						value: 'no',
						description: 'Continue'
					}
				],
				default: 'no'
			}).catch(cbInterrupt);
			
			if (answer == 'yes') {
				console.dir(tDevices, { depth: null });
			}
			
			const tDevice = await select({
				message: 'Select a device to test',
				choices: tDevices.map(d => ({
					name: d.objName,
					value: d,
					description: 
						JSON.stringify(d, undefined, '  ') 
				})),
			}).catch(cbInterrupt);
			
			if (tDevice.deviceType() == 'switch') {
				log(`Get device by ID (${tDevice})...`);
				tSwitch = client.getDeviceById(tDevice.objectId());
				log({ tSwitch });
				await sleep(200);
				
				log('Test Switch toggle control...');
		
				await tSwitch.toggle();
				await sleep(1000);
		
				await tSwitch.toggle();
				await sleep(500);

			} 
			else if (tDevice.deviceType() == 'light') {
				let devName = client.getDeviceById(tDevice.objectId()).name();
				log(`Get device by Name (${devName})...`);
				tBulb = client.getDeviceByName( devName );
				log({ tBulb });
				await sleep(200);
				
				log('Get light bulb brightness...');
				log(tBulb.brightness());
				await sleep(500);
				
				log('Test Light Bulb controls...');
				let response = await client.deviceControl(tBulb.objectId(), 'turnOnOff', { value: '1' });
				console.dir(response, { depth: null });
				await sleep(500);
		
				await tBulb.turnOff();
				await sleep(500);
		
				await tBulb.turnOn();
				await sleep(500);
		
				log('Test Light Bulb color brightness...');
				await tBulb.setBrightness(50);
				await sleep(500);

				log('Test Light Bulb color temperatures...');
				await tBulb.setColorTemp(1000);
				await sleep(500);
		
				await tBulb.setColorTemp(10000);
				await sleep(500);
		
				log('Set Light Bulb color (HSL)...');
				let color = { "hue": 78.34, "saturation": 1, "brightness": 100 };
				log({ color });
				await tBulb.setColor(color);
				await sleep(500);
		
				log('Set Light Bulb color (RGB)...');
				color = { "red": 230, "green": 0, "blue": 0 };
				log({ color });
				await tBulb.setColorRGB(color);
				await sleep(500);
		
				await tBulb.toggle();
				await sleep(500);
			}

		} catch (e) {
			console.error('Failed', e);
		}
		log('-----');

		log('Store session to configstore...');
		await finish();

        log('Success.');
	});

program
	.command('list')
	.description('list devices and their state / attributes')
	.option('--format [short|long]', 'format output', 'short')
	.action(async (opts) => {
		if (!['short', 'long'].includes(opts.format)) {
			console.error('Error: Invalid format.');
			return;
		}

		await init();
		
		const tDevices = client.getAllDevices();

		const slices = (opts.format == 'short' ? [0, 1] : [1]); 
		const icons = {
				'switch': `⏻ `,
				'light': `𖤓`,
			}, 
			statusColor = {
				true: 'cyan',
				false: 'grey',
			}, 
			stateColor = {
				true: 'green',
				false: 'grey',
			};

		const tableConfig = {
			head: Array.prototype.slice.apply([
				's) Device', 
				'Device ID',
				'Name',
				'Type',
				'Online',
				'State',
			], slices),
			widths: Array.prototype.slice.apply([40, 24, 15, 10, 8, 7], slices), 
			rows: tDevices.map(dev => 
				Array.prototype.slice.apply([
					`${icons[dev.objType][stateColor[dev.data.state]].reset} ${dev.objName[statusColor[dev.data.online]].reset}`,
					dev.objId, 
					dev.objName, 
					dev.objType, 
					dev.data.online, 
					dev.data.state
				], slices)
			)
		};

		console.log( 
			renderTable(tableConfig) 
		);

		await finish();
	});

program
	.command('control')
	.description('control a device\'s state')
	.argument('<name-or-id>', 'device name')
	.option('-s, --state [on|off]', 'set device state')
	.option('-x, --toggle', 'invert device state')
	.option('-b, --brightness [1-100]', 'set device brightness')
	.option('-t, --temperature [2700-6500]', 'set device temperature (disables color mode)')
	.option('-h, --hsl [h,s,l]', 'set light HSL color')
	.option('-r, --rgb [r,g,b]', 'set light RGB color')
	.action(async (device, opts) => {
		debug(device, {opts});

		await init();


		const actionMethods = {
			'on': 'turnOn',
			'off': 'turnOff',
			'toggle': 'toggle',
		};
		let tDevices = client.getAllDevices();
		tDevices = await Promise.all(tDevices.filter((dev) => (~dev.objName.toLowerCase().indexOf(device.toLowerCase()) || dev.objId == device)).map(async (dev) => {			
			// Known issue: device status is propagated once every N minutes
			// so that shouldn't stop us from trying
			if (0 && !dev.data.online) {
				return;
			}

			if (opts.state) {
				if (!Object.keys(actionMethods).includes(opts.state)) {
					console.error('Error: Invalid options format? Use DEBUG=cli');
					return;
				}
				debug(`Invoking ${actionMethods[opts.state]} on ${dev.objName}`);
				await dev[actionMethods[opts.state]]();
			} else if (opts.toggle) {
				debug(`Invoking toggle on ${dev.objName}`);
				await dev.toggle();
			} else if (opts.brightness) {
				debug(`Invoking setBrightness on ${dev.objName}`);
				await dev.setBrightness(opts.brightness);
			} else if (opts.temperature) {
				debug(`Invoking setColorTemp on ${dev.objName}`);
				await dev.setColorTemp(opts.temperature);
			} else if (opts.hsl) {
				const [ hue, saturation, brightness ] = opts.hsl.split(',');
				debug(`Invoking setColor on ${dev.objName} with HSL: ${JSON.stringify({ hue, saturation, brightness })}`);
				await dev.setColor({ hue, saturation, brightness });
			} else if (opts.rgb) {
				const [ red, green, blue ] = opts.rgb.split(',');
				debug(`Invoking setColor on ${dev.objName} with RGB: ${JSON.stringify({ red, green, blue })}`);
				await dev.setColorRGB({ red, green, blue });
			}
			return Promise.resolve(dev);
		}));
		
		await finish();
	});

// Get help
program
	.command('help')
	.description('output usage information')
	.action(() => {
		program.outputHelp();
	});


// Get version
program.version(version);

// Parse arguments
program.parse(process.argv);