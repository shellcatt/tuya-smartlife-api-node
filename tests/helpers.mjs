import 'dotenv/config';

/**
 * @description Ensure testing pipeline provides credentials
 */
export function checkEnvCredentials() {
    const requiredVars = ['HA_EMAIL', 'HA_PASS'];
    requiredVars.forEach((variable) => {
        if (!process.env[variable]) {
            throw new Error(`Missing required environment variable: ${variable}`);
        }
    });
}