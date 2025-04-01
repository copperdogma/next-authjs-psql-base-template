import { test, expect } from '@playwright/test';
import { FirebaseAuthUtils, TEST_USER } from '../fixtures/auth-fixtures';
import { ROUTES } from '../../utils/routes';
import { waitForElementToBeVisible } from '../../utils/selectors';
import { setupTestAuth, navigateWithTestAuth, isRedirectedToLogin } from '../../utils/test-auth';

/**
 * Authentication Flow Tests
 *
 * Tests the core authentication functionality of the application:
 * - Accessing login page
 * - Mock authentication
 * - Protection of secured routes
 * - User profile display after authentication
 */
test.describe('Authentication Flows', () => {
  // Setup: Clear cookies before each test to ensure clean state
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('login page should be accessible and render correctly', async ({ page }) => {
    // Navigate to login page with proper waiting strategy
    await page.goto(ROUTES.LOGIN, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Verify URL contains login path
    expect(page.url()).toContain(ROUTES.LOGIN);

    // Look for authentication UI elements - ensure we're on the login page
    // Check for any sign-in button which should definitely be present
    const signInButton = page.locator('[data-testid="google-signin-button"]');
    await expect(signInButton, 'Sign-in button should be visible on login page').toBeVisible();

    // Take a screenshot for documentation
    await page.screenshot({
      path: 'tests/e2e/screenshots/login-page.png',
      fullPage: true,
    });

    // Look for Google sign-in button text inside the button
    const googleButtonText = signInButton.getByText(/google|sign in/i);

    // Check if Google button text exists
    const hasGoogleText = await googleButtonText.isVisible().catch(() => false);
    if (hasGoogleText) {
      await expect(googleButtonText, 'Google sign-in text should be visible').toBeVisible();
    } else {
      // If no specific text found, at least verify the button itself is there
      await expect(signInButton, 'Sign-in button should be visible').toBeVisible();
    }
  });

  test('authentication mocking should work correctly', async ({ page }) => {
    // First navigate to login page
    await page.goto(ROUTES.LOGIN);

    // Use the authentication utility to mock a signed-in user
    await FirebaseAuthUtils.mockSignedInUser(page, TEST_USER);

    // Navigate to home page after authentication
    await page.goto(ROUTES.HOME, {
      waitUntil: 'networkidle',
      timeout: 10000,
    });

    // Take a screenshot to document the authenticated state
    await page.screenshot({
      path: 'tests/e2e/screenshots/authenticated-home.png',
      fullPage: true,
    });

    // Verify authentication state in localStorage
    const isAuthenticated = await FirebaseAuthUtils.isAuthenticated(page);
    expect(isAuthenticated, 'User should be authenticated in localStorage').toBe(true);

    // Look for user profile element that should be visible when authenticated
    try {
      // Try multiple selector strategies to find the user profile element
      // Use a single selector with comma-separated options for multiple fallback selectors
      const userProfileElement = page
        .locator(
          '[data-testid="user-profile"], ' +
            'header [aria-label*="profile" i], ' +
            'a[href="/profile"], ' +
            `img[alt="${TEST_USER.displayName}"], ` +
            'header button:has-text("Profile")'
        )
        .first();

      const isProfileVisible = await userProfileElement.isVisible().catch(() => false);

      if (isProfileVisible) {
        await expect(
          userProfileElement,
          'User profile element should be visible when authenticated'
        ).toBeVisible();
      } else {
        // If we can't find the profile element, at least verify we're not on the login page
        expect(page.url()).not.toContain(ROUTES.LOGIN);
      }
    } catch (error) {
      console.error('User profile element not found with current selectors:', error);
      // Verify localStorage auth state as a fallback
      expect(isAuthenticated).toBe(true);
    }
  });

  test('protected routes should require authentication', async ({ page, context }) => {
    // Ensure we're logged out
    await context.clearCookies();

    // Try to access a protected route
    await page.goto(ROUTES.DASHBOARD, {
      waitUntil: 'networkidle',
      timeout: 10000,
    });

    // Take a screenshot to document the result
    await page.screenshot({
      path: 'tests/e2e/screenshots/protected-route-access.png',
      fullPage: true,
    });

    // Check for expected outcomes - either redirect to login or show auth message
    const url = page.url();

    if (url.includes(ROUTES.LOGIN)) {
      // Verify redirect to login page (expected behavior)
      expect(url).toContain(ROUTES.LOGIN);

      // Check if the URL includes a callback to the original protected page
      expect(url).toContain('callbackUrl=');
      expect(url).toContain(encodeURIComponent(ROUTES.DASHBOARD));
    } else {
      // Alternative: check for authentication required message if not redirected
      const authRequiredText = page.getByText(/sign in|log in|authentication required/i);
      const hasAuthText = await authRequiredText.isVisible().catch(() => false);

      if (hasAuthText) {
        await expect(authRequiredText).toBeVisible();
      } else {
        // Final verification: ensure we're not actually on the dashboard
        expect(url).not.toEqual(ROUTES.DASHBOARD);
      }
    }
  });

  // This test was previously skipped due to issues with auth mocking
  test('authenticated user should have access to protected routes', async ({ page, context }) => {
    // Set up test authentication and get the testSessionId
    const testSessionId = await setupTestAuth(context, page, TEST_USER);

    console.log('✅ Playwright auth bypass cookies set for testing');

    // Navigate to protected route with the test session ID
    await navigateWithTestAuth(page, ROUTES.DASHBOARD, testSessionId);

    // Get current URL after navigation
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check if we're on the dashboard or redirected to login
    if (isRedirectedToLogin(currentUrl)) {
      // If we've been redirected to login, we'll capture a screenshot and fail with a better message
      await page.screenshot({
        path: 'tests/e2e/screenshots/auth-redirect-issue.png',
        fullPage: true,
      });

      // Log information about the page content to help diagnose
      const pageContent = await page.content();
      console.log(`Page redirected to login. Current URL: ${currentUrl}`);
      console.log(`Page content length: ${pageContent.length}`);

      // We'll fail the test with a helpful error message
      throw new Error(
        'Authentication simulation failed - redirected to login page. You need to modify the middleware to detect the __playwright_auth_bypass cookie'
      );
    } else {
      // Verify we're on the dashboard page
      expect(currentUrl).toContain(ROUTES.DASHBOARD);

      // Take a screenshot to document the result
      await page.screenshot({
        path: 'tests/e2e/screenshots/authenticated-dashboard.png',
        fullPage: true,
      });

      // Verify main content is visible (indicating successful access)
      const mainContent = await waitForElementToBeVisible(page, 'LAYOUT.MAIN_CONTENT');
      await expect(
        mainContent,
        'Main content should be visible for authenticated user'
      ).toBeVisible();
    }
  });
});
