import { jest } from '@jest/globals';
// import { sharedAuthConfig } from '../../../lib/auth-shared'; // Import the actual config

describe('Session Cookie Security (NextAuth.js)', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  // Helper to get the session token config under test
  const getSessionTokenConfig = () => {
    // Re-evaluate sharedAuthConfig by re-requiring or ensuring its evaluation if NODE_ENV changes
    // For jest, modules are often cached. A simple way if not deeply nested:
    // For this specific case, sharedAuthConfig directly reads process.env.NODE_ENV at module load.
    // So, we need to ensure it's re-evaluated or the relevant part is.
    // The easiest way is to access it each time after setting NODE_ENV.
    // A more robust way for complex scenarios might involve jest.resetModules() and re-require.
    return require('../../../lib/auth-shared').sharedAuthConfig.cookies?.sessionToken;
  };

  afterEach(() => {
    // Restore NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true,
    });
    // Reset modules to ensure NODE_ENV changes are picked up by lib/auth-shared.ts for next test
    jest.resetModules();
  });

  describe('Cookie Name', () => {
    it('should use __Secure- prefix and correct name in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      const config = getSessionTokenConfig();
      expect(config?.name).toBe('__Secure-next-auth.session-token');
    });

    it('should use non-prefixed name in development/test', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
      const config = getSessionTokenConfig();
      expect(config?.name).toBe('next-auth.session-token');

      Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', configurable: true });
      const testConfig = getSessionTokenConfig(); // Re-evaluate for 'test'
      expect(testConfig?.name).toBe('next-auth.session-token');
    });
  });

  describe('Cookie Options', () => {
    it('should set secure flag to true in production environment', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      const config = getSessionTokenConfig();
      expect(config?.options?.secure).toBe(true);
    });

    it('should set secure flag to false in non-production environments', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
      const devConfig = getSessionTokenConfig();
      expect(devConfig?.options?.secure).toBe(false);

      Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', configurable: true });
      const testConfig = getSessionTokenConfig();
      expect(testConfig?.options?.secure).toBe(false);
    });

    it('should always set httpOnly flag to true', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
      const prodConfig = getSessionTokenConfig();
      expect(prodConfig?.options?.httpOnly).toBe(true);

      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
      const devConfig = getSessionTokenConfig();
      expect(devConfig?.options?.httpOnly).toBe(true);
    });

    it('should always set the path to root ("/")', () => {
      const config = getSessionTokenConfig(); // NODE_ENV doesn't affect this option
      expect(config?.options?.path).toBe('/');
    });

    it('should always use SameSite=Lax', () => {
      const config = getSessionTokenConfig(); // NODE_ENV doesn't affect this option
      expect(config?.options?.sameSite).toBe('lax');
    });

    // maxAge is noted to be set in specific node/edge configs, so not tested here directly from sharedAuthConfig
    it('should have options defined', () => {
      const config = getSessionTokenConfig();
      expect(config?.options).toBeDefined();
    });
  });
});
