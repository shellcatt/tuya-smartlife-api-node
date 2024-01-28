import { TuyaSmartLifeClient, TuyaSmartLifeException } from "./TuyaSmartLifeClient.mjs";
import process from 'process';
import fs from 'fs';
import { promisify } from 'util';
import beautify from 'json-beautify';
import select from '@inquirer/select';
import { log } from "console";

import 'dotenv/config';

const env = process.env;

let sleep = promisify(setTimeout);

const SESSION_FILE = process.cwd() + '/session.json';


(async () => {

    const client = new TuyaSmartLifeClient();
    let tDevices, tBulb, tSwitch;

    log(fs.readFileSync(process.cwd() + '/tuya-ha.asc').toString('utf8'));
    await sleep(500);

    log('Read session.json file...');
    try {
        let cacheData = fs.readFileSync(SESSION_FILE).toString('utf8');
        const session = cacheData ? JSON.parse(cacheData) : {};

        if (!session?.accessToken) {
            await client.init(env.HA_EMAIL, env.HA_PASS, env.HA_CC);
        } else {
            await client.load(session);
            if (!session?.devices?.length) {
                await client.discoverDevices();
            }
        }
    } catch (e) {
        console.error('Error: Could not init Tuya session.', e);
        return;
    }

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
            message: 'Select a device to test',
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
        });
        if (answer == 'yes') {
            console.dir(tDevices, { depth: null });
        }
        
        const tDevice = await select({
            message: 'Select a device to test',
            choices: tDevices.map(d => ({
                name: d.objName,
                value: d,
                description: beautify(d, null, 2, 80)
            })),
        });
        
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

    log('Store session.json file...');
    try {
        fs.writeFileSync(SESSION_FILE, beautify(client.session, null, 2, 80));
        log('Success.');
    } catch (e) {
        console.error('Error: Could not save Tuya session cache.', e);
    }

})();