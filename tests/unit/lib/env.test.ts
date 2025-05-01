import { validateEnv, ENV, requiredEnvVars } from '../../../lib/env';
// Import logger to mock it
import { logger } from '../../../lib/logger';

// Mock the logger
jest.mock('../../../lib/logger', () => ({
  logger: {
    error: jest.fn(),
    // Add other methods if needed by other tests
  },
}));

describe('env module', () => {
  const originalEnv = process.env;
  const mockedLogger = jest.mocked(logger); // Get mocked instance

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Ensure mocks are cleared
    mockedLogger.error.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    // Helper to set all required vars for success cases
    const setValidRequiredEnv = () => {
      requiredEnvVars.forEach(varName => {
        process.env[varName] =
          varName === 'FIREBASE_PRIVATE_KEY'
            ? '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n'
            : 'test-value';
      });
    };

    it('returns success: false when required env variables are missing', () => {
      // Setup: Ensure other required vars are set to isolate the missing one
      setValidRequiredEnv();
      delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

      const result = validateEnv();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['NEXT_PUBLIC_FIREBASE_API_KEY'],
              message: 'NEXT_PUBLIC_FIREBASE_API_KEY is required', // Check message
            }),
          ])
        );
      }
      // In test mode, logger should not be called
      expect(mockedLogger.error).not.toHaveBeenCalled();
    });

    it('returns success: false for invalid data types', () => {
      setValidRequiredEnv();
      // @ts-ignore - Intentionally set wrong type for testing
      process.env.DATABASE_URL = 12345;

      const result = validateEnv();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['DATABASE_URL'],
              message: 'DATABASE_URL must be a string', // Check specific type error message
            }),
          ])
        );
      }
      expect(mockedLogger.error).not.toHaveBeenCalled();
    });

    it('throws and logs error outside of test environment on validation failure', () => {
      // Mock NODE_ENV
      jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });

      // Setup invalid state (missing variable)
      setValidRequiredEnv();
      delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

      // Expect validateEnv to throw
      expect(() => validateEnv()).toThrow('Invalid environment variables');

      // Expect logger.error to have been called
      expect(mockedLogger.error).toHaveBeenCalledTimes(1);
      expect(mockedLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ validationErrors: expect.any(Object) }), // Check for validationErrors key
        expect.stringContaining('❌ Invalid environment variables:') // Check basic message format
      );
    });

    it('returns success: true and parsed data when all required variables are present', () => {
      setValidRequiredEnv();

      const result = validateEnv();
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('test-value');
      }
      expect(mockedLogger.error).not.toHaveBeenCalled();
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
