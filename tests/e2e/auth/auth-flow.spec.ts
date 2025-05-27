import { test, expect } from '../utils/test-base';
// import { FirebaseAuthUtils, TEST_USER } from '../fixtures/auth-fixtures'; // Firebase-specific utils removed
import { ROUTES } from '../../utils/routes';
import { UI_ELEMENTS } from './auth-selectors';

// UI element selectors moved to auth-selectors.ts
// export const UI_ELEMENTS = { ... }; // Removed

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Kill any potential service worker that might interfere
    await page.addInitScript(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
    });
  });

  test('login page should redirect authenticated users', async ({ page }) => {
    // This test runs in an authenticated context (chromium project depends on auth.setup.ts)
    try {
      await page.goto(ROUTES.LOGIN, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
      await page.waitForTimeout(2000); // Allow time for redirect to occur

      // Expect to be redirected away from login to a protected/home route
      expect(page.url()).not.toContain(ROUTES.LOGIN);
      // Check if on dashboard or home, either is acceptable after login for an authenticated user
      const isOnDashboard = page.url().includes(ROUTES.DASHBOARD);
      const isOnHome = page.url().includes(ROUTES.HOME); // Assuming ROUTES.HOME is the root '/'
      expect(isOnDashboard || isOnHome).toBe(true);

      console.log(`✅ Authenticated user correctly redirected from login page to ${page.url()}`);
    } catch (error) {
      console.error('Error in login page redirect test (authenticated context):', error);
      await page.screenshot({ path: 'tests/e2e/screenshots/login-page-auth-redirect-error.png' });
      throw error;
    }
  });

  // Test 'authentication mock should work' removed as it relied on Firebase client-side mocking.
  // Authentication state is now handled by Playwright's storageState from auth.setup.ts.

  test('protected route should require authentication and redirect to login', async ({
    page,
    context,
  }) => {
    // Ensure unauthenticated state for this specific test
    await context.clearCookies();
    // Remove localStorage clearing to avoid security errors
    // await page.evaluate(() => localStorage.clear());

    await page.goto(ROUTES.DASHBOARD, { waitUntil: 'networkidle' });

    // Expect redirection to the login page
    await page.waitForURL(`**${ROUTES.LOGIN}**`, { timeout: 15000 });
    expect(page.url()).toContain(ROUTES.LOGIN);
    expect(page.url()).toContain(encodeURIComponent(ROUTES.DASHBOARD)); // Check for callbackUrl

    // Verify login page is showing
    const signInButton = page.locator(UI_ELEMENTS.AUTH.GOOGLE_SIGNIN); // Or a general login form identifier
    await expect(signInButton).toBeVisible({ timeout: 5000 });
    console.log('Protected route correctly redirected unauthenticated user to login page.');
  });
});
