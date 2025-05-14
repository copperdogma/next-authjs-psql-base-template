import { getDisplayErrorMessage, shouldShowErrorDetails } from './error-display';

// Helper to set NODE_ENV for tests
const setNodeEnv = (env: string | undefined) => {
  // This is a common way to mock process.env.NODE_ENV in Jest tests
  // when direct assignment is problematic or linted against.
  const mockProcessEnv = { ...process.env, NODE_ENV: env };
  jest.replaceProperty(process, 'env', mockProcessEnv as NodeJS.ProcessEnv);
};

describe('lib/utils/error-display', () => {
  const ORIGINAL_PROCESS_ENV = process.env;

  beforeEach(() => {
    jest.replaceProperty(process, 'env', ORIGINAL_PROCESS_ENV); // Restore original env before each test
  });

  afterAll(() => {
    jest.replaceProperty(process, 'env', ORIGINAL_PROCESS_ENV); // Ensure original env is restored after all tests
  });

  describe('getDisplayErrorMessage', () => {
    const defaultGenericMessage = 'An unexpected error occurred. Please try again.';
    const customGenericMessage = 'A custom generic error occurred.';

    describe('when NODE_ENV is production', () => {
      beforeEach(() => {
        setNodeEnv('production');
      });

      it('should return the default generic message if no custom one is provided and error is null', () => {
        expect(getDisplayErrorMessage(null)).toBe(defaultGenericMessage);
      });

      it('should return the default generic message if no custom one is provided, even if error has a message', () => {
        const error = new Error('Specific error message');
        expect(getDisplayErrorMessage(error)).toBe(defaultGenericMessage);
      });

      it('should return the custom generic message if provided, when error is null', () => {
        expect(getDisplayErrorMessage(null, customGenericMessage)).toBe(customGenericMessage);
      });

      it('should return the custom generic message if provided, even if error has a message', () => {
        const error = new Error('Specific error message');
        expect(getDisplayErrorMessage(error, customGenericMessage)).toBe(customGenericMessage);
      });

      it('should return the default generic message for an error without a message but with toString', () => {
        const error = { toString: () => 'Custom toString error' } as Error;
        expect(getDisplayErrorMessage(error)).toBe(defaultGenericMessage);
      });
    });

    describe('when NODE_ENV is development', () => {
      beforeEach(() => {
        setNodeEnv('development');
      });

      it('should return error.message if it exists', () => {
        const errorMessage = 'This is a specific dev error.';
        const error = new Error(errorMessage);
        expect(getDisplayErrorMessage(error)).toBe(errorMessage);
      });

      it('should return error.message even if custom generic message is provided', () => {
        const errorMessage = 'This is a specific dev error.';
        const error = new Error(errorMessage);
        expect(getDisplayErrorMessage(error, customGenericMessage)).toBe(errorMessage);
      });

      it('should return error.toString() if error.message is undefined', () => {
        const error = { toString: () => 'Error from toString' } as Error;
        expect(getDisplayErrorMessage(error)).toBe('Error from toString');
      });

      it('should return error.toString() if error.message is an empty string', () => {
        const error = new Error('');
        expect(getDisplayErrorMessage(error)).toBe(error.toString());
      });

      it('should return default generic message if error is null', () => {
        expect(getDisplayErrorMessage(null)).toBe(defaultGenericMessage);
      });

      it('should return custom generic message if error is null and custom one is provided', () => {
        expect(getDisplayErrorMessage(null, customGenericMessage)).toBe(customGenericMessage);
      });

      it('should return default generic message if error has no message and no toString (minimal error object)', () => {
        const error = { details: 'Minimal error' } as unknown as Error;
        expect(getDisplayErrorMessage(error)).toBe(defaultGenericMessage);
      });

      it('should return custom generic message if error has no message/toString (minimal error object) and custom one is provided', () => {
        const error = { details: 'Minimal error' } as unknown as Error;
        expect(getDisplayErrorMessage(error, customGenericMessage)).toBe(customGenericMessage);
      });
    });

    describe('when NODE_ENV is test (or any other non-production)', () => {
      beforeEach(() => {
        setNodeEnv('test');
      });

      it('should behave like development and return error.message', () => {
        const errorMessage = 'Test environment error.';
        const error = new Error(errorMessage);
        expect(getDisplayErrorMessage(error)).toBe(errorMessage);
      });

      it('should return default generic message if error is null', () => {
        expect(getDisplayErrorMessage(null)).toBe(defaultGenericMessage);
      });
    });
  });

  describe('shouldShowErrorDetails', () => {
    it('should return false when NODE_ENV is production', () => {
      setNodeEnv('production');
      expect(shouldShowErrorDetails()).toBe(false);
    });

    // Test cases for non-production environments
    const nonProductionEnvs: (string | undefined)[] = [
      'development',
      'test',
      undefined,
      'custom_env',
    ];
    nonProductionEnvs.forEach(env => {
      it(`should return true when NODE_ENV is '${env}' (non-production)`, () => {
        setNodeEnv(env);
        expect(shouldShowErrorDetails()).toBe(true);
      });
    });
  });
});
