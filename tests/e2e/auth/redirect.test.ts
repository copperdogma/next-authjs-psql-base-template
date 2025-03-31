import { test, expect } from '@playwright/test';

test.describe('Auth Redirection', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies to ensure we're unauthenticated
    await page.context().clearCookies();
  });

  test('should properly redirect and render login page with callback URL', async ({ page }) => {
    // Try to access a protected route (dashboard)
    await page.goto('/dashboard');

    // Check we've been redirected to the login page with some form of callbackUrl
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);

    // Get the URL - we'll just verify it contains the necessary components
    // without being too specific about the exact format
    const url = page.url();
    expect(url).toContain('callbackUrl=');
    expect(url).toContain('dashboard');

    // Take a screenshot of the login page after redirection
    await page.screenshot({ path: 'tests/e2e/screenshots/login-after-redirect.png' });

    // Look for a sign-in button regardless of exact text using data-testid
    const signInButton = page.locator('[data-testid="google-signin-button"]');
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Also check for welcome text using a broader match
    const welcomeText = page.getByRole('heading', { name: /welcome/i });
    await expect(welcomeText).toBeVisible({ timeout: 5000 });

    // Check that the page has meaningful content (not mostly blank)
    // Get the text content length of the main content area
    const contentLength = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.textContent?.trim().length || 0 : 0;
    });

    // Log the content length to debug the issue
    console.log(`Main content length: ${contentLength}`);

    // Check the body content too (more comprehensive)
    const bodyContent = await page.evaluate(() => {
      return document.body.textContent || '';
    });

    console.log(`Body content length: ${bodyContent.length}`);

    // Assert that there's meaningful content
    expect(bodyContent.length).toBeGreaterThan(20);

    // Check for navigation elements which should be present using a more flexible approach
    const hasNavigation = await page.evaluate(() => {
      return !!document.querySelector('nav, header, [role="navigation"]');
    });

    expect(hasNavigation).toBeTruthy();
  });

  test('should handle URL encoding correctly in callback URL', async ({ page }) => {
    // Try to access the dashboard
    await page.goto('/dashboard');

    // Get the redirected URL
    const url = page.url();

    // Extract the callback URL parameter - making it resilient to different formats
    const callbackUrlMatch = url.match(/callbackUrl=([^&]*)/);
    const callbackUrl = callbackUrlMatch ? callbackUrlMatch[1] : '';

    console.log(`Extracted callback URL: ${callbackUrl}`);

    // Verify we have some kind of encoded URL character in the callback
    // This is a more flexible approach that works with both Firebase Auth and NextAuth
    expect(callbackUrl).toMatch(/%[0-9A-F]{2}/);

    // Most importantly, check that 'dashboard' is somehow present in the callback
    expect(url).toMatch(/dashboard/i);

    // Take a screenshot to verify
    await page.screenshot({ path: 'tests/e2e/screenshots/callback-url-encoding.png' });
  });
});
