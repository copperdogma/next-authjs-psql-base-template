/**
 * Defines centralized application route paths.
 * Using a central file for routes enhances maintainability and consistency.
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  ABOUT: '/about',
  SETTINGS: '/settings',
  // API Routes
  API_AUTH_SESSION: '/api/auth/session',
  API_AUTH_LOGIN: '/api/auth/login', // Example if needed for Pages Router style API
  API_AUTH_REGISTER: '/api/auth/register', // Example if needed
  API_HEALTH: '/api/health',
  API_LOG_CLIENT: '/api/log/client',
  MANIFEST: '/manifest.webmanifest',
} as const; // Using 'as const' provides stricter typing

// Route prefixes for middleware use
export const API_PREFIXES = {
  AUTH: '/api/auth',
  TEST: '/api/test',
} as const;

// Route arrays for middleware convenience
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.ABOUT,
  ROUTES.API_HEALTH,
  ROUTES.API_LOG_CLIENT,
  ROUTES.MANIFEST,
] as const;

export const AUTH_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER] as const;

// Type helper for route values if needed elsewhere, though 'as const' often suffices
// export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
