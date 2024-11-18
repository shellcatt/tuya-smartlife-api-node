import { authLimiter } from './helpers.mjs';

describe('should cleanup', () => {
	it('reset last login time', async() => {
		try {
		  authLimiter.release();
		} catch (err) {
		  expect.fail('Should not fail at the end');
		}
	});
})