/* istanbul ignore file */
/**
 * Test Typing - Contains improved TypeScript types for test utilities and mocks
 *
 * This file is intentionally excluded from test coverage metrics because:
 * 1. It contains only TypeScript type definitions with no runtime code
 * 2. Type definitions are validated by the TypeScript compiler, not by unit tests
 * 3. There is no executable code to measure coverage for
 *
 * The `istanbul ignore file` comment above instructs the coverage tool to skip this file.
 */
import { RenderResult } from '@testing-library/react';
import { Page } from '@playwright/test';
import { UserEvent } from '@testing-library/user-event';

/**
 * Authentication context type for testing
 */
export interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  isClientSide: boolean;
  signIn: jest.Mock;
  signOut: jest.Mock;
  error: Error | null;
}

/**
 * Render result with user event and mock functions
 */
export interface TestRenderResult extends RenderResult {
  // Properly typed to accommodate both UserEvent from testing-library and MockUser
  user: UserEvent | MockUser | null;
  mockSignIn: jest.Mock;
  mockSignOut: jest.Mock;
  mockRouter?: {
    pathname: string;
    push: jest.Mock;
    replace: jest.Mock;
    back: jest.Mock;
    forward: jest.Mock;
    prefetch: jest.Mock;
    [key: string]: any;
  };
}

/**
 * Strongly typed mock user metadata
 */
export interface MockUserMetadata {
  creationTime: string;
  lastSignInTime: string;
}

/**
 * Strongly typed mock token result
 */
export interface MockIdTokenResult {
  token: string;
  expirationTime: string;
  authTime: string;
  issuedAtTime: string;
  signInProvider: string | null;
  signInSecondFactor: string | null;
  claims: {
    [key: string]: any;
  };
}

/**
 * Extended provider data type with proper typing
 */
export interface MockProviderData {
  providerId: string;
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
}

/**
 * Strongly typed mock user for tests
 */
export interface MockUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
  providerData: MockProviderData[];
  getIdToken: () => Promise<string>;
  getIdTokenResult: () => Promise<MockIdTokenResult>;
  toJSON: () => object;
}

/**
 * Test user configuration
 */
export interface TestUserConfig {
  ID: string;
  UID: string;
  EMAIL: string;
  NAME: string;
  DISPLAY_NAME: string;
  PHOTO_URL: string;
  PROVIDER_ID: string;
}

/**
 * E2E test selectors with improved typing
 */
export interface TestSelectors {
  LAYOUT: {
    NAVBAR: string;
    MAIN_CONTENT: string;
    FOOTER: string;
    CONTAINER: string;
  };
  AUTH: {
    SIGN_IN_BUTTON: string;
    SIGN_OUT_BUTTON: string;
    USER_PROFILE: string;
    USER_AVATAR: string;
  };
  FORM: {
    EMAIL_FIELD: string;
    PASSWORD_FIELD: string;
    SUBMIT_BUTTON: string;
  };
  NAV: {
    HOME_LINK: string;
    DASHBOARD_LINK: string;
    PROFILE_LINK: string;
    SETTINGS_LINK: string;
  };
}

/**
 * Performance metrics return type
 */
export interface PerformanceMetrics {
  loadTime: number;
  domContentLoadedTime: number;
  firstPaintTime: number;
  error?: string;
}

/**
 * Viewport information type
 */
export interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
}

/**
 * Auth cookie type
 */
export interface AuthCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Lax' | 'Strict' | 'None';
}

/**
 * Interface for login credentials
 */
export interface LoginCredentials {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  photoURL?: string;
}

/**
 * Interface for auth fixtures in e2e tests
 */
export interface AuthFixtures {
  authenticatedPage: Page;
}
