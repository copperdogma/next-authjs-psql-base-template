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
    it('throws an error when required env variables are missing', () => {
      // Remove a required env variable
      delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

      expect(() => validateEnv()).toThrow('Invalid environment variables');
    });

    it('returns the parsed environment when all required variables are present', () => {
      // Set all required env variables
      requiredEnvVars.forEach(varName => {
        process.env[varName] =
          varName === 'FIREBASE_PRIVATE_KEY'
            ? '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n'
            : 'test-value';
      });

      const result = validateEnv();
      expect(result).toBeDefined();
      expect(result.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('test-value');
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
