// Mock Firebase Admin before importing session
jest.mock('../../../lib/firebase-admin', () => ({
  auth: jest.fn(() => ({
    // Add any auth methods that might be called
    createSessionCookie: jest.fn(),
    verifySessionCookie: jest.fn(),
    revokeRefreshTokens: jest.fn(),
  })),
}));

import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '../../../lib/auth/session';

describe('Session Cookie Security', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  
  afterEach(() => {
    // Restore original NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true,
    });
  });

  it('should use secure and HttpOnly cookies', () => {
    // Mock production environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const options = getSessionCookieOptions();
    
    // Essential security properties
    expect(options.httpOnly).toBe(true); // Prevents client-side JavaScript access
    expect(options.secure).toBe(true);   // Ensures cookies are sent only over HTTPS
  });

  it('should use SameSite=lax to prevent CSRF', () => {
    const options = getSessionCookieOptions();
    
    // SameSite=lax prevents CSRF while allowing normal navigation
    expect(options.sameSite).toBe('lax');
  });

  it('should set appropriate path restriction', () => {
    const options = getSessionCookieOptions();
    
    // Cookie should be available throughout the application
    expect(options.path).toBe('/');
  });

  it('should use SESSION_COOKIE_NAME with a strong name', () => {
    // Cookie name should not reveal implementation details
    expect(SESSION_COOKIE_NAME).toBeDefined();
    expect(SESSION_COOKIE_NAME).toBe('session');
  });
}); 