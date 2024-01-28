#!/usr/bin/env node

import { TuyaSmartLifeClient, TuyaSmartLifeException } from './TuyaSmartLifeClient.mjs';
import { program } from 'commander';
import Table from 'cli-table3';

import fs from 'fs';
import colors from '@colors/colors';

import 'dotenv/config';

const env = process.env;

const packageJsonPath = new URL('./package.json', import.meta.url).pathname;
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));


const SESSION_FILE = process.cwd() + '/session.json';

const client = new TuyaSmartLifeClient();


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
    const NOW = Math.floor(Date.now() / 1000);

	try {
        let cacheData = fs.readFileSync(SESSION_FILE).toString('utf8');
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

async function finish() {
	try {
        fs.writeFileSync(SESSION_FILE, JSON.stringify(client.session));
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

	for (let row of rows) {	
		table.push(row);
	}

	return (table.toString());
}

program
	.command('list')
	.option('--format [short|long]', 'format output', 'short')
	.description('list all devices')
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