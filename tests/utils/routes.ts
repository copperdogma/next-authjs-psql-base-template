/**
 * Centralized route configuration for tests
 * This file defines all routes used in tests to make them more maintainable
 */

// Utility functions and constants related to application routes and navigation for tests

// Remove unused constants
// const PORT = process.env.PORT || '3000';
// const PROJECT_ID = 'next-firebase-base-template'; // Align this with firebase.json

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',

  // Protected routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',

  // API routes
  API_HEALTH: '/api/health',
  API_AUTH_SESSION: '/api/auth/session',
};

/**
 * Common route groups for different test scenarios
 */
export const ROUTE_GROUPS = {
  // Routes for accessibility testing
  ACCESSIBILITY: [ROUTES.HOME, ROUTES.LOGIN, ROUTES.DASHBOARD, ROUTES.PROFILE, ROUTES.SETTINGS],

  // Routes that require authentication
  PROTECTED: [ROUTES.DASHBOARD, ROUTES.PROFILE, ROUTES.SETTINGS],

  // Routes that are public
  PUBLIC: [ROUTES.HOME, ROUTES.LOGIN],
};

// Test configuration
export const TEST_CONFIG = {
  // Playwright test configuration
  VIEWPORT: {
    MOBILE: { width: 375, height: 667 },
    TABLET: { width: 768, height: 1024 },
    DESKTOP: { width: 1280, height: 800 },
  },

  // Firebase test configuration
  FIREBASE: {
    PROJECT_ID: 'next-firebase-base-template',
  },

  // Test data
  TEST_USER: {
    UID: 'test-uid-123',
    EMAIL: 'test@example.com',
    DISPLAY_NAME: 'Test User',
    PHOTO_URL: 'https://via.placeholder.com/150',
  },
};
