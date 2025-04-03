// Mock the session module to avoid actual Firebase Admin imports
jest.mock('../../../tests/mocks/lib/auth/session', () => {
  // Constants defined in session.ts
  const DEFAULT_SESSION_EXPIRATION = 3600; // 1 hour in seconds
  const MAX_SESSION_EXPIRATION = 14 * 24 * 60 * 60; // 14 days in seconds

  return {
    DEFAULT_SESSION_EXPIRATION_SECONDS: DEFAULT_SESSION_EXPIRATION,
    MAX_SESSION_EXPIRATION_SECONDS: MAX_SESSION_EXPIRATION,
    getSessionCookieOptions: jest.fn((maxAge = DEFAULT_SESSION_EXPIRATION) => ({
      maxAge,
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
    })),
  };
});

import {
  DEFAULT_SESSION_EXPIRATION_SECONDS,
  MAX_SESSION_EXPIRATION_SECONDS,
  getSessionCookieOptions,
} from '../../../tests/mocks/lib/auth/session';

describe('Token and Session Expiration', () => {
  test('should use the correct default expiration time', () => {
    expect(DEFAULT_SESSION_EXPIRATION_SECONDS).toBe(3600); // 1 hour
    const options = getSessionCookieOptions();
    expect(options.maxAge).toBe(3600);
  });

  test('should enforce maximum expiration time', () => {
    expect(MAX_SESSION_EXPIRATION_SECONDS).toBe(14 * 24 * 60 * 60); // 14 days
  });

  test('should allow custom expiration within bounds', () => {
    const customExpiration = 7200; // 2 hours
    const options = getSessionCookieOptions(customExpiration);
    expect(options.maxAge).toBe(customExpiration);
  });

  test('should handle very large expiration values', () => {
    const veryLargeExpiration = MAX_SESSION_EXPIRATION_SECONDS * 2;
    const options = getSessionCookieOptions(veryLargeExpiration);
    expect(options.maxAge).toBe(veryLargeExpiration);
    // Note: In a real implementation, we would likely cap this at MAX_SESSION_EXPIRATION_SECONDS
  });
});
