import { test as base, Page } from '@playwright/test';
import { UI_SELECTORS } from './test-fixtures';
import { LoginCredentials, AuthFixtures } from '../../utils/test-types';

/**
 * Centralized test user data for authentication tests
 * This ensures we use consistent user data across all tests
 */
export const TEST_USER: LoginCredentials = {
  uid: 'test-user-id-123',
  email: 'test-user@example.com',
  password: 'TestPassword123',
  displayName: 'Test User',
};

/**
 * Firebase Auth Utils for E2E tests
 * Common functions for mocking Firebase Auth in tests
 */
export class FirebaseAuthUtils {
  /**
   * Mock a signed-in user for tests
   * @param page Playwright page object
   * @param userData User data to mock (defaults to TEST_USER)
   */
  static async mockSignedInUser(page: Page, userData: LoginCredentials = TEST_USER): Promise<void> {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 14); // 14 days expiration

      // Get current URL to use for the cookies
      const currentUrl = page.url();
      
      // Set cookies using Playwright's API instead of page.evaluate
      await page.context().addCookies([
        {
          name: 'auth.uid',
          value: userData.uid,
          url: currentUrl,
          expires: Math.floor(expirationDate.getTime() / 1000),
          sameSite: 'Lax' as const
        },
        {
          name: 'auth.email',
          value: userData.email,
          url: currentUrl,
          expires: Math.floor(expirationDate.getTime() / 1000),
          sameSite: 'Lax' as const
        },
        {
          name: 'auth.name',
          value: userData.displayName,
          url: currentUrl,
          expires: Math.floor(expirationDate.getTime() / 1000),
          sameSite: 'Lax' as const
        },
        {
          name: 'session',
          value: 'mock-firebase-session-token',
          url: currentUrl,
          expires: Math.floor(expirationDate.getTime() / 1000),
          sameSite: 'Lax' as const
        }
      ]);

      // Dispatch auth state change event via page.evaluate
      await page.evaluate(user => {
        try {
          const event = new CustomEvent('auth-state-changed', {
            detail: { user: { uid: user.uid, email: user.email, displayName: user.displayName } },
          });
          window.dispatchEvent(event);
          console.log('✅ Auth state change event dispatched');
        } catch (eventError) {
          console.error('⚠️ Failed to dispatch auth event:', eventError);
        }
      }, userData);

      console.log(`✅ Auth cookies set for user: ${userData.email}`);
    } catch (cookieError) {
      if (cookieError instanceof Error) {
        console.error(`⚠️ Failed to set auth cookies: ${cookieError.message}`);
      } else {
        console.error('⚠️ Failed to set auth cookies with unknown error');
      }
      throw cookieError; // Re-throw to fail the test
    }
  }

  /**
   * Clear authentication state for tests
   * @param page Playwright page object
   */
  static async clearAuthState(page: Page): Promise<void> {
    try {
      // Clear all cookies using Playwright's API
      await page.context().clearCookies();

      // Dispatch sign-out event via page.evaluate
      await page.evaluate(() => {
        try {
          const event = new CustomEvent('auth-state-changed', { detail: { user: null } });
          window.dispatchEvent(event);
          console.log('✅ Auth state change event dispatched (signed out)');
        } catch (eventError) {
          console.error('⚠️ Failed to dispatch sign-out event:', eventError);
        }
      });

      console.log('✅ Auth cookies cleared');
    } catch (error) {
      if (error instanceof Error) {
        console.error(`⚠️ Failed to clear auth cookies: ${error.message}`);
      } else {
        console.error('⚠️ Failed to clear auth cookies with unknown error');
      }
      throw error; // Re-throw to fail the test
    }
  }

  /**
   * Check if a user is authenticated
   * @param page Playwright page object
   * @returns Whether the user is authenticated
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    // First check cookies using Playwright's API - this is the most reliable method
    const cookies = await page.context().cookies();
    const hasAuthUidCookie = cookies.some(cookie => cookie.name === 'auth.uid' && cookie.value);
    const hasSessionCookie = cookies.some(cookie => cookie.name === 'session' && cookie.value);
    
    if (hasAuthUidCookie && hasSessionCookie) {
      return true;
    }

    // Fallback: look for common UI elements that indicate a signed-in state
    // but only if we're on a valid page (not error page)
    const url = page.url();
    const isValidPage = !(url.includes('/404') || url.includes('/error') || url.includes('/500'));

    if (isValidPage) {
      // Look for sign-out button or user profile elements
      return await page.evaluate(selectors => {
        const signOutSelectors = [
          selectors.AUTH.SIGN_OUT_BUTTON,
          selectors.AUTH.USER_PROFILE,
          selectors.AUTH.USER_AVATAR,
          '[data-testid="user-menu"]',
          '[data-testid="sign-out-button"]',
        ];

        for (const selector of signOutSelectors) {
          const element = document.querySelector(selector);
          if (element) return true;
        }

        return false;
      }, UI_SELECTORS);
    }

    return false;
  }
}

// Create the base test with auth fixtures
export const test = base.extend<AuthFixtures>({
  // Provide access to auth utilities
  authUtils: [
    async ({}, use: (utils: typeof FirebaseAuthUtils) => Promise<void>) => {
      await use(FirebaseAuthUtils);
    },
    { scope: 'test' },
  ],

  // Fixture for an authenticated page
  authenticatedPage: [
    async ({ page }, use) => {
      // Sign in the test user
      await FirebaseAuthUtils.mockSignedInUser(page);

      // Verify authentication worked
      const isAuthenticated = await FirebaseAuthUtils.isAuthenticated(page);
      if (!isAuthenticated) {
        throw new Error('Failed to authenticate test user');
      }

      // Use the authenticated page
      await use(page);

      // Clean up after test
      await FirebaseAuthUtils.clearAuthState(page);
    },
    { scope: 'test' },
  ],
});
