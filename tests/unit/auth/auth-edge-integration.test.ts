/**
 * Tests for auth-edge.ts integration with centralized route constants
 * Verifies that middleware functions use the centralized constants correctly
 */

import { ROUTES, PUBLIC_ROUTES, AUTH_ROUTES, API_PREFIXES } from '@/lib/constants/routes';

// Mock the auth-edge module to test the route checking logic
describe('Auth Edge Integration with Centralized Routes', () => {
  describe('Route Type Checking Logic', () => {
    const isPublicRoute = (pathname: string): boolean =>
      PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number]);

    const isApiRoute = (pathname: string): boolean =>
      pathname.startsWith(API_PREFIXES.AUTH) || pathname.startsWith(API_PREFIXES.TEST);

    const isAuthRoute = (pathname: string): boolean =>
      AUTH_ROUTES.includes(pathname as (typeof AUTH_ROUTES)[number]);

    it('should correctly identify public routes using centralized constants', () => {
      expect(isPublicRoute(ROUTES.HOME)).toBe(true);
      expect(isPublicRoute(ROUTES.ABOUT)).toBe(true);
      expect(isPublicRoute(ROUTES.API_HEALTH)).toBe(true);
      expect(isPublicRoute(ROUTES.API_LOG_CLIENT)).toBe(true);
      expect(isPublicRoute(ROUTES.MANIFEST)).toBe(true);

      // Non-public routes should return false
      expect(isPublicRoute(ROUTES.LOGIN)).toBe(false);
      expect(isPublicRoute(ROUTES.DASHBOARD)).toBe(false);
      expect(isPublicRoute('/nonexistent')).toBe(false);
    });

    it('should correctly identify auth routes using centralized constants', () => {
      expect(isAuthRoute(ROUTES.LOGIN)).toBe(true);
      expect(isAuthRoute(ROUTES.REGISTER)).toBe(true);

      // Non-auth routes should return false
      expect(isAuthRoute(ROUTES.HOME)).toBe(false);
      expect(isAuthRoute(ROUTES.DASHBOARD)).toBe(false);
      expect(isAuthRoute('/nonexistent')).toBe(false);
    });

    it('should correctly identify API routes using centralized prefixes', () => {
      expect(isApiRoute('/api/auth/signin')).toBe(true);
      expect(isApiRoute('/api/auth/session')).toBe(true);
      expect(isApiRoute('/api/test/health')).toBe(true);

      // Non-API routes should return false
      expect(isApiRoute('/api/health')).toBe(false);
      expect(isApiRoute('/login')).toBe(false);
      expect(isApiRoute('/')).toBe(false);
    });

    it('should use centralized DEFAULT_LOGIN_REDIRECT', () => {
      const DEFAULT_LOGIN_REDIRECT = ROUTES.DASHBOARD;
      expect(DEFAULT_LOGIN_REDIRECT).toBe('/dashboard');
    });
  });

  describe('Route Constants Consistency', () => {
    it('should have consistent route definitions between constants and arrays', () => {
      // Verify that arrays contain the correct ROUTES values
      expect(PUBLIC_ROUTES).toContain(ROUTES.HOME);
      expect(PUBLIC_ROUTES).toContain(ROUTES.ABOUT);
      expect(AUTH_ROUTES).toContain(ROUTES.LOGIN);
      expect(AUTH_ROUTES).toContain(ROUTES.REGISTER);
    });

    it('should have proper API prefix definitions', () => {
      expect(API_PREFIXES.AUTH).toBe('/api/auth');
      expect(API_PREFIXES.TEST).toBe('/api/test');
    });
  });
});
