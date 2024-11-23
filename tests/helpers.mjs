import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import 'dotenv/config';

const packageJsonPath = new URL('../package.json', import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));


const llfn = `${dirname(fileURLToPath(import.meta.url))}/.last-login`;

export const authLimiter = {
	setLastLogin: () => {
		writeFileSync(llfn, `${Math.floor(Date.now()/1000)}`);
	},
	getLastLogin: () => {
		return existsSync(llfn) ? Number(readFileSync(llfn)) || 0 : 0;
	},
	release: () => {
		existsSync(llfn) && unlinkSync(llfn);
	}
}

export function checkEnvCredentials() {
    const requiredVars = ['HA_EMAIL', 'HA_PASS'];
    requiredVars.forEach((variable) => {
        if (!process.env[variable]) {
            throw new Error(`Missing required environment variable: ${variable}`);
        }
    });
}

export const sessionStoreIdTest = `${pkg.name}_session_test`;