import { getDisplayErrorMessage, shouldShowErrorDetails } from '@/lib/utils/error-display';

describe('lib/utils/error-display', () => {
  const genericProdMessage = 'A production error occurred.';
  const specificDevMessage = 'This is a specific dev error.';
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    // Restore all of process.env to its original state before each test
    // to ensure test isolation for any other env vars that might be manipulated.
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const setNodeEnv = (value: string | undefined) => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value,
      writable: true,
      configurable: true,
    });
  };

  const deleteNodeEnv = () => {
    // To truly simulate undefined, we delete it and then can re-define if needed.
    // If just set to undefined, it might behave differently than if the property doesn't exist.
    // However, for most checks `process.env.NODE_ENV === undefined` is sufficient.
    // We will use defineProperty to set it to undefined to satisfy TS and how Node handles it.
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  };

  describe('getDisplayErrorMessage', () => {
    describe('when NODE_ENV is production', () => {
      beforeEach(() => {
        setNodeEnv('production');
      });

      it('should return the generic message when error has a message', () => {
        const error = new Error(specificDevMessage);
        expect(getDisplayErrorMessage(error, genericProdMessage)).toBe(genericProdMessage);
      });

      it('should return the generic message when error has no message but toString', () => {
        const error = { toString: () => specificDevMessage } as Error;
        expect(getDisplayErrorMessage(error, genericProdMessage)).toBe(genericProdMessage);
      });

      it('should return the generic message when error is null', () => {
        expect(getDisplayErrorMessage(null, genericProdMessage)).toBe(genericProdMessage);
      });

      it('should return the generic message when error is undefined', () => {
        expect(getDisplayErrorMessage(undefined, genericProdMessage)).toBe(genericProdMessage);
      });

      it('should return the default generic message if none is provided', () => {
        const error = new Error(specificDevMessage);
        expect(getDisplayErrorMessage(error)).toBe(
          'An unexpected error occurred. Please try again.'
        );
      });
    });

    describe('when NODE_ENV is not production (e.g., development/test)', () => {
      beforeEach(() => {
        setNodeEnv('development');
      });

      it('should return error.message if available', () => {
        const error = new Error(specificDevMessage);
        expect(getDisplayErrorMessage(error, genericProdMessage)).toBe(specificDevMessage);
      });

      it('should return error.toString() if message is not available but toString is', () => {
        const error = { toString: () => 'Error from toString' } as Error;
        expect(getDisplayErrorMessage(error, genericProdMessage)).toBe('Error from toString');
      });

      it('should return genericMessage if error.message and error.toString() are not available (e.g. empty error object)', () => {
        const error = {} as Error;
        expect(getDisplayErrorMessage(error, genericProdMessage)).toBe('[object Object]');
      });

      it('should return genericMessage if error is null', () => {
        expect(getDisplayErrorMessage(null, genericProdMessage)).toBe(genericProdMessage);
      });

      it('should return genericMessage if error is undefined', () => {
        expect(getDisplayErrorMessage(undefined, genericProdMessage)).toBe(genericProdMessage);
      });

      it('should return the default generic message if error is null and no generic message provided', () => {
        expect(getDisplayErrorMessage(null)).toBe(
          'An unexpected error occurred. Please try again.'
        );
      });

      it('should prioritize error.message over error.toString()', () => {
        const error = {
          message: specificDevMessage,
          toString: () => 'Should not be this',
        } as Error;
        expect(getDisplayErrorMessage(error, genericProdMessage)).toBe(specificDevMessage);
      });
    });
  });

  describe('shouldShowErrorDetails', () => {
    it('should return false when NODE_ENV is production', () => {
      setNodeEnv('production');
      expect(shouldShowErrorDetails()).toBe(false);
    });

    it('should return true when NODE_ENV is development', () => {
      setNodeEnv('development');
      expect(shouldShowErrorDetails()).toBe(true);
    });

    it('should return true when NODE_ENV is test', () => {
      setNodeEnv('test');
      expect(shouldShowErrorDetails()).toBe(true);
    });

    it('should return true when NODE_ENV is undefined', () => {
      deleteNodeEnv();
      expect(shouldShowErrorDetails()).toBe(true);
    });
  });
});
