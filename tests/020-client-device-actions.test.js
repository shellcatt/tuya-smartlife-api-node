import { TuyaSmartLifeClient, SmartLifeSession, TuyaSmartLifeException, settings as TuyaDefaults } from '../TuyaSmartLifeClient.mjs';
import { sessionStoreIdTest } from './helpers.mjs';

import { expect } from 'chai';

import Configstore from 'configstore';


describe('TuyaSmartLifeClient device actions', () => {
  
  let client, sessionStore;

  
  describe('client request()', () => {
    before(() => {
      client = new TuyaSmartLifeClient();
    });
    
    it('should initialize persistent session store', async() => {
      try {
        sessionStore = new Configstore(sessionStoreIdTest);
        expect(sessionStore.get('session')).to.exist;
      } catch (err) {
        expect.fail('Should have initialized an existing session store');
      }

      let sessionCache;
      try {
        sessionCache = sessionStore.get('session');
        await client.load(sessionCache);
        expect(client.session.accessToken).to.not.be.empty
        expect(client.session.refreshToken).to.not.be.empty;
      } catch (err) {
        expect.fail('Should have loaded session to client');
      }
    });

    it('should handle successful API requests', async () => {
      // Mock successful response
      client._fetch = async () => ({
        json: async () => ({
          header: { code: 'SUCCESS' },
          payload: { someData: 'test' }
        })
      });
      // console.log(client.session.devices[0]);
      const response = await client.request('turnOff', 'control', client.session.devices[0].objId, { value: '1' });
      expect(response.header.code).to.equal('SUCCESS');
    });

    it('should handle failed API requests', async () => {
      // Mock failed response
      client._fetch = async () => ({
        json: async () => ({
          header: { code: 'ERROR' },
          payload: { error: 'Test error' }
        })
      });

      const response = await client.request('TestAction', 'test');
      expect(response.header.code).to.equal('ERROR');
    });
  });
  
  describe('client device list - by id, name, and type', () => {
    beforeEach(async () => {
      // Setup mock devices
      client = new TuyaSmartLifeClient();
      client.load({
        accessToken: sessionStore.get('session.accessToken'),
        refreshToken: sessionStore.get('session.refreshToken'), 
        devices: [
          { id: '1', name: 'Device1', dev_type: 'switch', ha_type: 'switch' },
          { id: '2', name: 'Device2', dev_type: 'light', ha_type: 'light' }
        ]
      });
    });

    it('should get device by ID', () => {
      const device = client.getDeviceById('1');
      expect(device).to.exist;
      expect(device.objectId()).to.equal('1');
      expect(device.name()).to.equal('Device1');
    });

    it('should get device by name', () => {
      const device = client.getDeviceByName('Device2');
      expect(device).to.exist;
      expect(device.name()).to.equal('Device2');
      expect(device.objectId()).to.equal('2');
    });

    it('should get devices by type', () => {
      const devices = client.getDevicesByType('switch');
      expect(devices).to.have.lengthOf(1);
      expect(devices[0].deviceType()).to.equal('switch');
      expect(devices[0].name()).to.equal('Device1');
    });
  });
});

// TODO 
// Token refresh logic
// Device discovery
// Device control operations
// Rate limiting handling
// Error scenarios
