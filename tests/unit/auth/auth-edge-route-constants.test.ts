/**
 * Tests for centralized route definitions in auth-edge.ts
 * Ensures that middleware uses centralized route constants from lib/constants/routes.ts
 */

import { ROUTES, PUBLIC_ROUTES, AUTH_ROUTES, API_PREFIXES } from '@/lib/constants/routes';

describe('Auth Edge Route Constants Integration', () => {
  describe('Route Constants Availability', () => {
    it('should have all required public routes in ROUTES constant', () => {
      expect(ROUTES.HOME).toBe('/');
      expect(ROUTES.ABOUT).toBe('/about');
      expect(ROUTES.API_HEALTH).toBe('/api/health');
      expect(ROUTES.API_LOG_CLIENT).toBe('/api/log/client');
      expect(ROUTES.MANIFEST).toBe('/manifest.webmanifest');
    });

    it('should have all required auth routes in ROUTES constant', () => {
      expect(ROUTES.LOGIN).toBe('/login');
      expect(ROUTES.REGISTER).toBe('/register');
    });

    it('should have default login redirect route in ROUTES constant', () => {
      expect(ROUTES.DASHBOARD).toBe('/dashboard');
    });
  });

  describe('Route Constants Type Safety', () => {
    it('should maintain type safety with as const assertion', () => {
      // This test ensures ROUTES is properly typed as const
      const homeRoute: '/' = ROUTES.HOME;
      const loginRoute: '/login' = ROUTES.LOGIN;

      expect(homeRoute).toBe('/');
      expect(loginRoute).toBe('/login');
    });
  });

  describe('Route Arrays and Prefixes', () => {
    it('should provide PUBLIC_ROUTES array with correct routes', () => {
      expect(PUBLIC_ROUTES).toContain(ROUTES.HOME);
      expect(PUBLIC_ROUTES).toContain(ROUTES.ABOUT);
      expect(PUBLIC_ROUTES).toContain(ROUTES.API_HEALTH);
      expect(PUBLIC_ROUTES).toContain(ROUTES.API_LOG_CLIENT);
      expect(PUBLIC_ROUTES).toContain(ROUTES.MANIFEST);
    });

    it('should provide AUTH_ROUTES array with correct routes', () => {
      expect(AUTH_ROUTES).toContain(ROUTES.LOGIN);
      expect(AUTH_ROUTES).toContain(ROUTES.REGISTER);
    });

    it('should provide API_PREFIXES with correct prefixes', () => {
      expect(API_PREFIXES.AUTH).toBe('/api/auth');
      expect(API_PREFIXES.TEST).toBe('/api/test');
    });
  });
});
