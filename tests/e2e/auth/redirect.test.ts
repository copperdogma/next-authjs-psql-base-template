import { test, expect } from '@playwright/test';

test.describe('Auth Redirection', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies to ensure we're unauthenticated
    await page.context().clearCookies();
  });

  test('should properly redirect and render login page with callback URL', async ({ page }) => {
    // Try to access a protected route (dashboard)
    await page.goto('/dashboard');

    // Check we've been redirected to the login page with a callbackUrl
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);

    // Ensure the URL is properly encoded (contains the dashboard path in encoded form)
    const url = page.url();
    expect(url).toContain('callbackUrl=http%3A%2F%2Flocalhost%3A');
    expect(url).toContain('%2Fdashboard');

    // Take a screenshot of the login page after redirection
    await page.screenshot({ path: 'tests/e2e/screenshots/login-after-redirect.png' });

    // This test will check if redirection to login produces a blank page
    // Verify the login page has rendered properly - check for essential elements
    const signInButton = page.getByText('Sign In with Google', { exact: true });
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Also check for the welcome text
    const welcomeText = page.getByText('Welcome', { exact: true });
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
    expect(contentLength).toBeGreaterThan(20);

    // Check for navigation elements which should be present
    const navigationElements = await page.locator('nav').count();
    expect(navigationElements).toBeGreaterThan(0);
  });

  test('should handle URL encoding correctly in callback URL', async ({ page }) => {
    // This test specifically targets the double-encoding issue seen in the screenshot
    // The URL in the screenshot was: /login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fdashboard

    // Try to access the dashboard
    await page.goto('/dashboard');

    // Get the redirected URL
    const url = page.url();

    // Verify there's no double encoding (no %25 sequences which would be double-encoded % signs)
    expect(url).not.toContain('%25');

    // Extract the callback URL parameter
    const callbackUrlMatch = url.match(/callbackUrl=([^&]*)/);
    const callbackUrl = callbackUrlMatch ? callbackUrlMatch[1] : '';

    console.log(`Extracted callback URL: ${callbackUrl}`);

    // Verify it's properly encoded exactly once
    expect(callbackUrl).toContain('%3A'); // : encoded once
    expect(callbackUrl).toContain('%2F'); // / encoded once

    // Take a screenshot to verify
    await page.screenshot({ path: 'tests/e2e/screenshots/callback-url-encoding.png' });
  });
});
