import { test as base, Page, BrowserContext } from '@playwright/test';
import { TEST_CONFIG } from '../../utils/routes';

// Test user data for authentication tests - use the centralized test configuration
export const TEST_USER = {
  uid: TEST_CONFIG.TEST_USER.UID,
  email: TEST_CONFIG.TEST_USER.EMAIL,
  displayName: TEST_CONFIG.TEST_USER.DISPLAY_NAME,
  photoURL: TEST_CONFIG.TEST_USER.PHOTO_URL,
  emailVerified: true,
  isAnonymous: false,
  // Add other properties expected by Firebase Auth
  phoneNumber: null,
  providerData: [
    {
      providerId: 'password',
      uid: TEST_CONFIG.TEST_USER.EMAIL,
      displayName: TEST_CONFIG.TEST_USER.DISPLAY_NAME,
      email: TEST_CONFIG.TEST_USER.EMAIL,
      phoneNumber: null,
      photoURL: TEST_CONFIG.TEST_USER.PHOTO_URL,
    },
  ],
  // Mock required methods
  getIdToken: () => Promise.resolve('mock-id-token'),
  metadata: { creationTime: new Date().toISOString(), lastSignInTime: new Date().toISOString() },
};

/**
 * Firebase Auth test utilities
 * Provides common functions for mocking Firebase authentication in tests
 */
export class FirebaseAuthUtils {
  /**
   * Mock a signed-in user
   * @param page Playwright page
   * @param user User data to mock
   */
  static async mockSignedInUser(page: Page, user = TEST_USER) {
    // Convert user object to JSON to avoid serialization issues
    const userJson = JSON.stringify(user);

    // Set cookies as the primary authentication mechanism for E2E tests
    try {
      const domain = new URL(page.url()).hostname || 'localhost';
      await page.context().addCookies([
        {
          name: 'firebase_auth_mock',
          value: userJson.slice(0, 4000), // Limit size for cookies
          domain: domain,
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        }
      ]);
      console.log('Successfully set auth state via cookies');
    } catch (cookieError) {
      console.error('Failed to set auth cookies:', cookieError);
      // If we can't set cookies, our test will likely fail - throw the error
      throw new Error(`Cannot set auth cookies: ${cookieError instanceof Error ? cookieError.message : String(cookieError)}`);
    }

    // Make sure the page is registered to listen for auth state changes
    try {
      // Only attempt to dispatch events if we're on a loaded page
      const currentUrl = page.url();
      if (currentUrl && currentUrl.startsWith('http')) {
        await page.evaluate((userData) => {
          try {
            // Don't try to access localStorage, just dispatch events
            window.dispatchEvent(
              new CustomEvent('authStateChanged', {
                detail: { user: userData },
              })
            );
            return true;
          } catch (error) {
            console.log('Event dispatch failed, but cookies were set');
            return false;
          }
        }, user).catch(() => {
          // Ignore errors in page.evaluate - cookies are set which is the main thing
        });
      }
    } catch (error) {
      console.log('Note: Could not dispatch auth events, but cookies are set:', error);
    }

    // Add a small delay to let the auth state propagate
    await page.waitForTimeout(300);
  }

  /**
   * Clear authentication state
   * @param page Playwright page
   */
  static async clearAuthState(page: Page) {
    // Clear auth cookies - the primary and most reliable method for E2E tests
    try {
      await page.context().clearCookies();
      console.log('Successfully cleared auth cookies');
    } catch (cookieError) {
      console.error('Failed to clear auth cookies:', cookieError);
    }

    // Skip localStorage operations entirely to avoid cross-origin issues in E2E tests
    
    // Instead, attempt to trigger a simple auth change event if possible
    try {
      // Only try to dispatch an event if we're on a valid page
      const currentUrl = page.url();
      if (currentUrl && currentUrl.startsWith('http')) {
        await page.evaluate(() => {
          try {
            // Just dispatch the auth state change event without touching localStorage
            window.dispatchEvent(
              new CustomEvent('authStateChanged', {
                detail: { user: null },
              })
            );
            return { success: true };
          } catch (e) {
            // Ignore errors from event dispatch
            return { success: false, reason: 'Event dispatch failed' };
          }
        }).catch(() => {
          // Ignore evaluate errors - we've already cleared cookies
        });
      }
    } catch (error) {
      // Just log the error - as long as cookies are cleared, auth state should be reset
      console.log('Note: Could not dispatch auth event, but cookies were cleared');
    }
  }

  /**
   * Check if user is authenticated
   * @param page Playwright page
   * @param config Optional Firebase configuration with more flexibility
   * @returns Promise<boolean>
   */
  static async isAuthenticated(page: Page, config?: any): Promise<boolean> {
    // For E2E tests, only check for auth cookies - much more reliable across browsers
    try {
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(c => c.name === 'firebase_auth_mock');
      if (authCookie) {
        // Found an auth cookie - user is authenticated
        return true;
      }
    } catch (cookieError) {
      console.error('Error checking auth cookies:', cookieError);
    }

    // If no auth cookie was found, check if we're logged in on the UI level
    // by looking for common auth UI elements that indicate signed-in state
    try {
      // Only check if we're on a valid page
      const currentUrl = page.url();
      if (currentUrl && currentUrl.startsWith('http')) {
        // Look for common auth UI indicators like profile elements, sign out buttons, etc.
        const hasAuthUI = await page.evaluate(() => {
          // Check for common auth UI patterns without using localStorage
          // Look for sign out buttons or user profile elements
          const signOutBtn = document.querySelector('button:not([disabled]):is(:contains("Sign Out"), :contains("Log Out"), :contains("Logout"), :contains("Sign out"))');
          const userProfileElement = document.querySelector('[data-testid="user-profile"], [aria-label*="profile" i], [aria-label*="account" i]');
          
          // If we find any of these UI elements, consider the user authenticated
          return !!signOutBtn || !!userProfileElement;
        }).catch(() => false); // Any error means we couldn't check, return false
        
        if (hasAuthUI) {
          return true;
        }
      }
    } catch (error) {
      console.log('Error checking auth UI state:', error);
    }

    // No auth cookie or UI indicators found - user is not authenticated
    return false;
  }
}

// Define the types for our custom fixtures
type AuthFixtures = {
  authUtils: typeof FirebaseAuthUtils;
  authenticatedPage: Page;
};

// Auth fixture that extends the base test with authentication utilities
export const test = base.extend<AuthFixtures>({
  // Auth utilities directly available in tests
  authUtils: async ({}, use) => {
    await use(FirebaseAuthUtils);
  },

  // Page with authentication already set up
  authenticatedPage: async ({ page }, use) => {
    // Sign in the test user
    await FirebaseAuthUtils.mockSignedInUser(page);

    // Go to home page
    await page.goto('/');

    // Use the authenticated page
    await use(page);

    // Clean up - clear auth state
    await FirebaseAuthUtils.clearAuthState(page);
  },
});
