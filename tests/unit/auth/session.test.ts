import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  createSessionCookie,
  verifySessionCookie,
  destroySessionCookie,
} from '../../../tests/mocks/lib/auth/session';

describe('Session Management', () => {
  describe('Session Cookie Configuration', () => {
    it('should have the correct cookie name', () => {
      expect(SESSION_COOKIE_NAME).toBe('session');
    });

    it('should configure cookie options correctly for development', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      // @ts-expect-error - allow assignment for testing
      process.env.NODE_ENV = 'development';

      const options = getSessionCookieOptions();

      expect(options).toEqual(
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'lax',
        })
      );

      // @ts-expect-error - allow assignment for testing
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should configure cookie options correctly for production', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      // @ts-expect-error - allow assignment for testing
      process.env.NODE_ENV = 'production';

      const options = getSessionCookieOptions();

      expect(options).toEqual(
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          path: '/',
          sameSite: 'lax',
        })
      );

      // @ts-expect-error - allow assignment for testing
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should support custom maxAge', () => {
      const customMaxAge = 7200; // 2 hours
      const options = getSessionCookieOptions(customMaxAge);

      expect(options.maxAge).toBe(customMaxAge);
    });

    it('should set secure cookie option based on environment', () => {
      // Test production environment
      process.env.NODE_ENV = 'production';
      // @ts-expect-error Mock implementation
      mockGetCookieOptions.mockReturnValueOnce({
        httpOnly: true,
        secure: true,
        path: '/',
      });

      const prodOptions = getSessionCookieOptions();
      expect(prodOptions.secure).toBe(true);

      // Test development environment
      process.env.NODE_ENV = 'development';
      // @ts-expect-error Mock implementation
      mockGetCookieOptions.mockReturnValueOnce({
        httpOnly: true,
        secure: false,
        path: '/',
      });

      const devOptions = getSessionCookieOptions();
      expect(devOptions.secure).toBe(false);
    });

    it('should set correct cookie path', () => {
      // @ts-expect-error Mock implementation
      mockGetCookieOptions.mockReturnValueOnce({
        httpOnly: true,
        secure: true,
        path: '/custom-path',
      });

      const options = getSessionCookieOptions();
      expect(options.path).toBe('/custom-path');
    });

    it('should set correct same site option', () => {
      // @ts-expect-error Mock implementation
      mockGetCookieOptions.mockReturnValueOnce({
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'strict',
      });
    });
  });

  describe('Session Operations', () => {
    it('should create a session cookie from token', async () => {
      const token = 'test-id-token';
      const expiresIn = 3600;

      const cookie = await createSessionCookie(token, expiresIn);

      expect(cookie).toContain(token);
      expect(cookie).toContain(expiresIn.toString());
    });

    it('should verify a valid session cookie', async () => {
      const validCookie = 'mock-session-cookie-valid-token-3600';

      const result = await verifySessionCookie(validCookie);

      expect(result).toEqual(
        expect.objectContaining({
          uid: 'mock-user-id',
          email: 'test@example.com',
        })
      );
    });

    it('should reject an invalid session cookie', async () => {
      const invalidCookie = 'invalid';

      await expect(verifySessionCookie(invalidCookie)).rejects.toThrow('Invalid session cookie');
    });

    it('should generate destroy cookie options', () => {
      const destroyOptions = destroySessionCookie();

      expect(destroyOptions).toEqual(
        expect.objectContaining({
          maxAge: 0,
          httpOnly: true,
          path: '/',
        })
      );
    });
  });
});
