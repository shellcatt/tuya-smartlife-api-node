import {
  TuyaSmartLifeClient, 
  SmartLifeSession, 
  TuyaSmartLifeException, 
  settings as TuyaDefaults,
  authStoreId,
  sessionStoreIdTest 
} from '../src/index';

import { 
  checkEnvCredentials
} from './helpers';

import { expect } from 'chai';
import { describe } from 'mocha';

import { promisify } from 'node:util';
const sleep = promisify(setTimeout);

import Configstore from 'configstore';

const env = process.env;


describe('TuyaSmartLifeClient authentication & session management', () => {
  
  checkEnvCredentials();

  const username = env.HA_EMAIL;
  const password = env.HA_PASS;
  const region = env.HA_REGION || TuyaDefaults.REGION;
  const countryCode = env.HA_CC || TuyaDefaults.COUNTRYCODES[region];

  let client, authStore, sessionStore;

  describe('client init()', () => {
    before('create client', () => {
      client = new TuyaSmartLifeClient();
    });
    
    it('should initialize persistent auth & session store', async() => {
      try {
        authStore = new Configstore(authStoreId);
        sessionStore = new Configstore(sessionStoreIdTest);
      } catch (err) {
        expect.fail('Should have initialized session store');
      }
    });

    it('should initialize client with correct credentials', async () => {
      try {
        await client.init(username, password, region, countryCode);
      } catch (err) {
        if (err instanceof TuyaSmartLifeException && err.message.includes(`${env.LOGIN_INTERVAL}`)) {
          const NOW = Math.floor(Date.now() / 1000);
          const lastLogin = authConfigStore.get('lastLogin') || NOW;
          const duration = Math.abs((lastLogin + Number(env.LOGIN_INTERVAL)) - NOW);
          // console.log({lastLogin, 'interval': env.LOGIN_INTERVAL, NOW, duration});
          console.log(`last login was at ${(Date(lastLogin*1000))}, so retrying after ${duration} seconds...`);

          await sleep( duration * 1000 );
          await client.init(username, password, region, countryCode);
        } else {
          console.log('Ice Ice Baby', err.message);
        }
      }
      
      expect(client.session).to.exist;
      expect(client.session.username).to.equal(username);
      expect(client.session.password).to.equal(password);
      expect(client.session.region).to.equal(region);
      expect(client.session.countryCode).to.equal(countryCode);
    });

    it('should store last login', async () => {
      try {
        authStore.set('lastLogin', Math.floor(Date.now()/1000));
      } catch (err) {
        expect.fail('Should have stored last login', err);
      }
    })

    it('should store a persistent session', async() => {
      try {
        sessionStore.set('session', client.session)
      } catch (err) {
        expect.fail('Should have stored the session');
      }
    });

    it('should throw error with invalid credentials', async () => {
      try {
        await client.init('bad-user', 'bad-pass', region, countryCode);
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err).to.be.instanceof(TuyaSmartLifeException);
      }
    });
  });

  describe('session constructor()', async () => {
    it('should load from cache correctly', async () => {
      const mockCache = {
        region: "eu",                                                                                                                               
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        refreshTime: 1731852241,                                                                                                                    
        lastUpdate: 1731852211,                                                                                                                     
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        devices: [],
	  };

	  const sess = new SmartLifeSession(mockCache);
	  expect(sess.accessToken).to.equal(mockCache.accessToken);
	  expect(sess.refreshToken).to.equal(mockCache.refreshToken);
	  expect(sess.region).to.equal(mockCache.region);
    });
  });

  describe('client load(), session check() & refresh()', async () => {
    it('should load from cache correctly', async () => {
      const mockCache = {
        region: region,
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        refreshTime: 1731852241,
        lastUpdate: 1731852211,
        expireTime: Math.floor(Date.now() / 1000) + 3600,
        devices: [],
	    };

      try {
        await client.load(mockCache);
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err).to.be.instanceof(TuyaSmartLifeException);
      }

      let sessionCache;
      try {
        sessionCache = sessionStore.get('session');
        await client.load(sessionCache);
      } catch (err) {
        expect(err).to.be.instanceof(TuyaSmartLifeException);
      }
      expect(client.session.accessToken).to.not.be.empty
      expect(client.session.refreshToken).to.not.be.empty;
      expect(client.session.region).to.equal(sessionCache.region);
      expect(client.session.expireTime).to.be.greaterThan( Math.floor(Date.now() / 1000) );
    });
  });
  
});


// TODO 
// Token refresh logic
// Device discovery
// Device control operations
// Rate limiting handling
// Error scenarios
