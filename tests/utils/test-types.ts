/**
 * Test Typing - Contains improved TypeScript types for test utilities and mocks
 */
import { User, UserInfo, IdTokenResult } from '@firebase/auth';
import { RenderResult } from '@testing-library/react';
import { Page } from '@playwright/test';

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
  user?: MockUser | null;
  mockSignIn: jest.Mock;
  mockSignOut: jest.Mock;
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
export interface MockIdTokenResult extends Omit<IdTokenResult, 'claims'> {
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
export interface MockProviderData extends UserInfo {
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
export interface MockUser extends Omit<User, 'metadata' | 'providerData'> {
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
  providerData: {
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }[];
  getIdToken: () => Promise<string>;
  getIdTokenResult: () => Promise<MockIdTokenResult>;
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
  authUtils: any; // Will be FirebaseAuthUtils
  authenticatedPage: Page;
} 