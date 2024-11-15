#!/usr/bin/env node

import { TuyaSmartLifeClient } from './TuyaSmartLifeClient.mjs';
import { program } from 'commander';
import Table from 'cli-table3';

import fs from 'fs';
import colors from '@colors/colors';
import beautify from 'json-beautify';

import initDebug from 'debug';
const debug = initDebug('cli');

import 'dotenv/config';

const env = process.env;

const packageJsonPath = new URL('./package.json', import.meta.url).pathname;
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));


const SESSION_FILE = process.cwd() + '/session.json';

const client = new TuyaSmartLifeClient();


const actionMethods = {
	'on': 'turnOn',
	'off': 'turnOff',
	'toggle': 'toggle',
}
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

async function init() {
	try {
        const cacheData = fs.readFileSync(SESSION_FILE).toString('utf8');
        const session = cacheData ? JSON.parse(cacheData) : {};

        if (!session?.accessToken) {
            await client.init(env.HA_EMAIL, env.HA_PASS, env.HA_REGION, env.HA_CC);
        } else {
            await client.load(session);
        }
		await client.pollDevicesUpdate();
    } catch (e) {
        console.error('Error: Could not init Smart Life session.', e);
        return;
    }
}

function finish() {
	try {
        fs.writeFileSync(SESSION_FILE, beautify(client.session, null, 2, 80));
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

		finish();
	});

program
	.command('control')
	.description('control a device\'s state')
	.argument('<name>', 'device name')
	.option('-s, --state [on|off]', 'set device state')
	.option('-x, --toggle', 'invert device state')
	.option('-b, --brightness [1-100]', 'set device brightness')
	.option('-t, --temperature [2700-6500]', 'set device temperature (disables color mode)')
	.option('-h, --hsl [h,s,l]', 'set light HSL color')
	.option('-r, --rgb [r,g,b]', 'set light RGB color')
	.action(async (device, opts) => {
		debug(device, {opts});

		await init();

		let tDevices = client.getAllDevices();
		tDevices = await Promise.all(tDevices.filter((dev) => (~dev.objName.toLowerCase().indexOf(device.toLowerCase()) || dev.objId == device)).map(async (dev) => {			
			if (!dev.data.online) 
				return;

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
				debug(`Invoking setBrightnes on ${dev.objName}`);
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

			return dev;
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
program.version(pkg.version);

// Parse arguments
program.parse(process.argv);