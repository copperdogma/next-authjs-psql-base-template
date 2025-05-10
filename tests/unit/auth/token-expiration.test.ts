import { authConfigEdge } from '../../../lib/auth-edge';
import { authConfigNode } from '../../../lib/auth-node';

describe('NextAuth.js Session and Cookie Expiration', () => {
  describe('Edge Configuration (authConfigEdge)', () => {
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

    it('should set sessionToken cookie maxAge to 30 days', () => {
      expect(authConfigEdge.cookies?.sessionToken?.options?.maxAge).toBe(thirtyDaysInSeconds);
    });

    it('should set JWT session maxAge to 30 days', () => {
      expect(authConfigEdge.session?.maxAge).toBe(thirtyDaysInSeconds);
    });
  });

  describe('Node Configuration (authConfigNode)', () => {
    it('should not explicitly set sessionToken cookie maxAge (relying on NextAuth.js defaults)', () => {
      // authConfigNode inherits from sharedAuthConfig where sessionToken.options.maxAge is not set.
      // NextAuth.js typically defaults this to be the same as the session.maxAge or has its own default.
      expect(authConfigNode.cookies?.sessionToken?.options?.maxAge).toBeUndefined();
    });

    it('should not explicitly set JWT session maxAge (relying on NextAuth.js default of 30 days)', () => {
      // authConfigNode.session does not override maxAge from sharedSessionConfig, where it's also not set.
      // NextAuth.js defaults to 30 days for JWT expiration if session.maxAge is not provided.
      expect(authConfigNode.session?.maxAge).toBeUndefined();
    });

    // Note: Testing the *effective* default maxAge applied by NextAuth.js when these are undefined
    // would require a more integrated test setup. These tests verify our explicit configuration.
  });

  // The constants DEFAULT_SESSION_EXPIRATION_SECONDS and MAX_SESSION_EXPIRATION_SECONDS
  // from the old mock file are not used in the actual application configuration.
  // If such specific, shorter or different bounded expirations are needed, they should be
  // defined and used within the NextAuthConfig objects.
});
