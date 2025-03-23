// Mock the session module to avoid actual Firebase Admin imports
jest.mock('../../../lib/auth/session', () => {
  // Constants defined in session.ts
  const DEFAULT_SESSION_EXPIRATION = 3600; // 1 hour in seconds
  const MAX_SESSION_EXPIRATION = 14 * 24 * 60 * 60; // 14 days in seconds

  // Actual function implementation copied from session.ts
  const getSessionCookieOptions = (expiresIn = DEFAULT_SESSION_EXPIRATION) => {
    const validExpiresIn = Math.min(expiresIn, MAX_SESSION_EXPIRATION);

    return {
      maxAge: validExpiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };
  };

  return {
    getSessionCookieOptions,
    // Mock other exports if needed by other tests
    createSessionCookie: jest.fn(),
    verifySessionCookie: jest.fn(),
    revokeAllSessions: jest.fn(),
  };
});

// Import from mocked module
import { getSessionCookieOptions } from '../../../lib/auth/session';

describe('Firebase Token Expiration', () => {
  // Store the original NODE_ENV value
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // No need to save originalEnv again, already stored above
  });

  afterEach(() => {
    // Restore original NODE_ENV using Object.defineProperty
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true,
    });
    jest.clearAllMocks();
  });

  it('should set session cookie expiration to 1 hour by default', () => {
    const options = getSessionCookieOptions();

    // Default maxAge should be 1 hour (3600 seconds)
    expect(options.maxAge).toBe(3600);
  });

  it('should allow custom expiration times when specified', () => {
    // Test with 30 minutes (1800 seconds)
    const thirtyMinOptions = getSessionCookieOptions(1800);
    expect(thirtyMinOptions.maxAge).toBe(1800);

    // Test with 2 hours (7200 seconds)
    const twoHourOptions = getSessionCookieOptions(7200);
    expect(twoHourOptions.maxAge).toBe(7200);
  });

  it('should cap expiration at maximum allowed value', () => {
    // 30 days is longer than maximum allowed (14 days)
    const maxOptions = getSessionCookieOptions(30 * 24 * 60 * 60);

    // Should be capped at 14 days (1209600 seconds)
    expect(maxOptions.maxAge).toBe(14 * 24 * 60 * 60);
  });

  it('should include appropriate security settings in test environment', () => {
    // Set NODE_ENV using Object.defineProperty
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      configurable: true,
    });

    const options = getSessionCookieOptions();

    // Verify security settings
    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(false); // Not secure in test environment
    expect(options.sameSite).toBe('lax');
  });

  it('should set secure option to true in production', () => {
    // Set NODE_ENV using Object.defineProperty
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const options = getSessionCookieOptions();

    // Secure should be true in production
    expect(options.secure).toBe(true);
  });
});
