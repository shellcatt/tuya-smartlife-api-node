import { TuyaSmartLifeClient, TuyaSmartLifeException } from "./TuyaSmartLifeClient.mjs";
import process from 'process';
import fs from 'fs';
import { log } from "console";
import { promisify } from 'util';
import beautify from 'json-beautify';

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
        tDevices = client.getAllDevices();
        log('Fetch device list...');
        console.dir(tDevices, { depth: null });
        await sleep(500);

        if (!tDevices.length) {
            log('No devices found.');
            return;
        }
        log('Get device by ID...');
        tSwitch = client.getDeviceById(tDevices.at(-1).objectId());
        log({ tSwitch });
        await sleep(500);

        log('Get device by Name...');
        tBulb = client.getDeviceByName('Bulb');
        log({ tBulb });
        await sleep(500);
        
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
        tBulb.setColorTemp(1000);
        await sleep(500);

        tBulb.setColorTemp(10000);
        await sleep(500);

        log('Set Light Bulb color...');
        let color = { "hue": 78.34, "saturation": 1, "brightness": 100 };
        log({ color });
        await tBulb.setColor(color);
        await sleep(500);

        await tBulb.toggle();
        await sleep(500);

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