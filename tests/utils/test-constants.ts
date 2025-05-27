/**
 * Centralized test constants for unit and integration tests
 * This helps avoid duplicating values and makes tests more maintainable
 */

// HTTP
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Authentication
export const AUTH = {
  MOCK_TOKEN: 'mock-firebase-token',
  MOCK_SESSION_COOKIE: 'mock-session-cookie',
  COOKIE_NAME: 'session',
  SESSION_COOKIE_EXPIRES_IN_SECONDS: 5 * 24 * 60 * 60, // 5 days in seconds
  INVALID_TOKEN: 'invalid-token',
};

// User data
export const TEST_USER = {
  uid: 'test-user-id-' + Math.random().toString(36).substring(2, 7), // Renamed from ID, randomized
  email: 'test@example.com', // Renamed from EMAIL
  name: 'Test User', // Kept original NAME, might be used elsewhere
  displayName: 'Test User', // Renamed from DISPLAY_NAME
  photoURL: 'https://via.placeholder.com/150', // Renamed from PHOTO_URL
  password: 'TestPassword123!', // Renamed from PASSWORD
};

// Database
export const DATABASE = {
  VALID_CONNECTION_TEST_QUERY: 'SELECT 1',
  EXPECTED_RESULT: { result: 1 },
  INVALID_CONNECTION_STRING: 'postgresql://invalid:invalid@localhost:5432/invalid?schema=public',
  TEST_DB_PREFIX: '{{YOUR_PROJECT_NAME}}-test-',
};

// Component states
export const COMPONENT_STATES = {
  AUTH_STATES: {
    SIGN_IN: 'sign-in',
    SIGN_OUT: 'sign-out',
  },
  LOADING: 'true',
  TEST_IDS: {
    AUTH_BUTTON: 'auth-button',
    AUTH_BUTTON_PLACEHOLDER: 'auth-button-placeholder',
  },
};

// API endpoints
export const API_ENDPOINTS = {
  SESSION: '/api/auth/session',
  HEALTH: '/api/health',
};

// Common test domains
export const TEST_DOMAINS = {
  LOCAL: 'http://localhost:3000',
};

// Firebase configuration for tests
export const FIREBASE_TEST_CONFIG = {
  API_KEY: 'test-api-key',
  AUTH_DOMAIN: 'test-project.firebaseapp.com',
  PROJECT_ID: 'test-project-id',
  STORAGE_BUCKET: 'test-storage-bucket',
  MESSAGING_SENDER_ID: 'test-messaging-sender-id',
  APP_ID: 'test-app-id',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

export const TEST_ENV_VARS = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test-auth-domain.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project-id', // Keep this as is for general config?
  // ... other NEXT_PUBLIC vars
  FIREBASE_PROJECT_ID: 'next-firebase-base-template', // For optional Firebase services, align this with firebase.json if used
  FIREBASE_CLIENT_EMAIL: 'test-client-email@example.com',
  FIREBASE_PRIVATE_KEY: 'test-private-key',
};

export const TEST_CONSTANTS = {
  APP_NAME: 'TestApp',
  BASE_URL: 'http://localhost:3000', // Adjust port if needed for tests
  API_URL: 'http://localhost:3000/api',
  PROJECT_ID: 'next-firebase-base-template', // For optional Firebase services, align this with firebase.json if used
  TEST_SESSION_TOKEN: 'mock-session-token-123',
  MOCK_CSRF_TOKEN: 'mock-csrf-token-456',
};
