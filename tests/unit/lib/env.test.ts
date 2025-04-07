import { validateEnv, env, ENV, requiredEnvVars } from '../../../lib/env';

describe('env module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('returns success: false when required env variables are missing', () => {
      // Remove a required env variable
      delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

      const result = validateEnv();

      // Now we check the result object instead of expecting a throw
      expect(result.success).toBe(false);
      // Check if the error details include the missing key
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['NEXT_PUBLIC_FIREBASE_API_KEY'] }),
          ])
        );
      }
    });

    it('returns success: true and parsed data when all required variables are present', () => {
      // Set all required env variables
      requiredEnvVars.forEach(varName => {
        process.env[varName] =
          varName === 'FIREBASE_PRIVATE_KEY'
            ? '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n'
            : 'test-value';
      });

      const result = validateEnv();
      expect(result.success).toBe(true);

      // Access data via result.data if successful
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('test-value');
      }
    });
  });

  describe('ENV object', () => {
    it('verifies environment flags', () => {
      // We can't modify NODE_ENV directly in tests as it's read-only
      // Instead we just test the current values
      expect(ENV.NODE_ENV).toBeDefined();

      // One of these will be true depending on the current environment
      expect(ENV.IS_DEVELOPMENT || ENV.IS_PRODUCTION || ENV.IS_TEST).toBe(true);
    });

    it('checks default values for optional environment variables', () => {
      // Just verify the type and structure, not exact values that may change
      expect(ENV.APP_URL).toBeDefined();
      expect(typeof ENV.APP_URL).toBe('string');
      expect(ENV.APP_URL.startsWith('http')).toBe(true);

      expect(ENV.API_URL).toBeDefined();
      expect(typeof ENV.API_URL).toBe('string');
      expect(ENV.API_URL.includes('/api')).toBe(true);
    });
  });
});
