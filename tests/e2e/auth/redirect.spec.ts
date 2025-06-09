import { test, expect } from '@playwright/test';

// Define UI elements directly in this file to avoid circular dependencies
const UI_ELEMENTS = {
  AUTH: {
    GOOGLE_SIGNIN: '[data-testid="google-signin-button"]',
  },
};

test.describe('Auth Redirection', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies to ensure we're unauthenticated
    await page.context().clearCookies();
  });

  test('should properly redirect and render login page with callback URL', async ({ page }) => {
    // Set longer timeout for this test
    test.setTimeout(45000); // Increased timeout

    console.log('Auth Redirection Test: Attempting to access /dashboard (unauthenticated)');
    await page.goto('/dashboard');

    // Explicitly wait for the URL to change to the login page
    try {
      await page.waitForURL('**/login**', { timeout: 15000 }); // Wait for login in URL
    } catch (e) {
      console.error('Auth Redirection Test: Timed out waiting for /login in URL.');
      await page.screenshot({ path: 'tests/e2e/screenshots/redirect-timeout-to-login.png' });
      throw e; // Re-throw to fail the test
    }

    const url = page.url();
    console.log(`Auth Redirection Test: Current URL after waiting: ${url}`);

    expect(url).toContain('/login'); // Ensure we are on the login page
    expect(url).toContain('callbackUrl=');
    expect(url).toContain(encodeURIComponent('/dashboard')); // Check for encoded dashboard

    // Take a screenshot of the login page after redirection
    await page.screenshot({ path: 'tests/e2e/screenshots/login-after-redirect.png' });

    // Check for the sign-in button using data-testid (most reliable)
    const signInButton = page.locator(UI_ELEMENTS.AUTH.GOOGLE_SIGNIN);
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Check for the specific "Login" heading element
    const heading = page.getByRole('heading', { name: 'Login' });
    await expect(heading).toBeVisible({ timeout: 5000 });

    const bodyContent = await page.evaluate(() => {
      return document.body.textContent || '';
    });
    console.log(`Auth Redirection Test: Body content length on login page: ${bodyContent.length}`);
    expect(bodyContent.length).toBeGreaterThan(20); // Basic content check
  });

  test('should handle URL encoding correctly in callback URL', async ({ page }) => {
    // Set longer timeout for this test
    test.setTimeout(45000); // Increased timeout

    console.log(
      'Auth Redirection Encoding Test: Attempting to access /dashboard (unauthenticated)'
    );
    await page.goto('/dashboard');

    // Explicitly wait for the URL to change to the login page
    try {
      await page.waitForURL('**/login**', { timeout: 15000 });
    } catch (e) {
      console.error('Auth Redirection Encoding Test: Timed out waiting for /login in URL.');
      await page.screenshot({
        path: 'tests/e2e/screenshots/redirect-encoding-timeout-to-login.png',
      });
      throw e;
    }

    const url = page.url();
    console.log(`Auth Redirection Encoding Test: Current URL after waiting: ${url}`);
    expect(url).toContain('/login');

    const callbackUrlMatch = url.match(/callbackUrl=([^&]*)/);
    const callbackUrl = callbackUrlMatch ? callbackUrlMatch[1] : '';

    console.log(`Auth Redirection Encoding Test: Extracted callback URL: ${callbackUrl}`);
    expect(callbackUrl).toBe(encodeURIComponent('/dashboard')); // Expect exact encoded match

    await page.screenshot({ path: 'tests/e2e/screenshots/callback-url-encoding.png' });
  });
});
