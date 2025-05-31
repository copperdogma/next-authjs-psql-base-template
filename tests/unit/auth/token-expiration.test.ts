import { authConfigEdge } from '../../../lib/auth-edge';
import { authConfigNode } from '../../../lib/auth-node';
import { SESSION_MAX_AGE } from '../../../lib/auth-shared';

describe('NextAuth.js Session and Cookie Expiration', () => {
  describe('Edge Configuration (authConfigEdge)', () => {
    it('should set sessionToken cookie maxAge to 30 days', () => {
      expect(authConfigEdge.cookies?.sessionToken?.options?.maxAge).toBe(SESSION_MAX_AGE);
    });

    it('should set JWT session maxAge to 30 days', () => {
      expect(authConfigEdge.session?.maxAge).toBe(SESSION_MAX_AGE);
    });
  });

  describe('Node Configuration (authConfigNode)', () => {
    it('should explicitly set sessionToken cookie maxAge to 30 days for consistency', () => {
      // We now explicitly set the maxAge in sharedAuthConfig for consistency across runtimes
      expect(authConfigNode.cookies?.sessionToken?.options?.maxAge).toBe(SESSION_MAX_AGE);
    });

    it('should explicitly set JWT session maxAge to 30 days for consistency', () => {
      // We now explicitly set the maxAge in sharedAuthConfig for consistency across runtimes
      expect(authConfigNode.session?.maxAge).toBe(SESSION_MAX_AGE);
    });

    // Note: By explicitly setting these values, we ensure consistent behavior
    // across different environments and make the configuration more self-documenting.
  });

  // Test the SESSION_MAX_AGE constant itself
  describe('SESSION_MAX_AGE constant', () => {
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

    it('should be set to 30 days in seconds', () => {
      expect(SESSION_MAX_AGE).toBe(thirtyDaysInSeconds);
    });
  });

  // The constants DEFAULT_SESSION_EXPIRATION_SECONDS and MAX_SESSION_EXPIRATION_SECONDS
  // from the old mock file are not used in the actual application configuration.
  // If such specific, shorter or different bounded expirations are needed, they should be
  // defined and used within the NextAuthConfig objects.
});
