import { test, expect } from '@playwright/test';

test.describe('Login Page Rendering', () => {
  test('should properly render login page with callback URL', async ({ page }) => {
    // Navigate directly to login with a callback URL
    await page.goto('/login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fdashboard');

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/e2e/screenshots/direct-login-callback.png' });

    // Check for the signin button using data-testid (most reliable)
    const signInButton = page.locator('[data-testid="google-signin-button"]');
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Verify the page has rendered properly by checking for basic structure elements
    const loginHeading = page.locator('#login-header');
    await expect(loginHeading).toBeVisible({ timeout: 5000 });

    // Verify page is not empty
    const bodyContent = await page.evaluate(() => {
      return document.body.textContent || '';
    });
    expect(bodyContent.length).toBeGreaterThan(50);

    // Check for navigation structure without being specific about content
    const hasNavElement = await page.evaluate(() => {
      return Boolean(
        document.querySelector('nav') ||
        document.querySelector('header') ||
        document.querySelector('[role="navigation"]')
      );
    });
    expect(hasNavElement).toBeTruthy();
  });

  test('should render login page properly WITHOUT a callback URL', async ({ page }) => {
    // Navigate directly to login WITHOUT a callback URL
    await page.goto('/login');

    // Take a screenshot for comparison
    await page.screenshot({ path: 'tests/e2e/screenshots/direct-login-no-callback.png' });

    // Check for the signin button using data-testid (most reliable)
    const signInButton = page.locator('[data-testid="google-signin-button"]');
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Verify the page has rendered properly by checking for basic structure
    const loginHeading = page.locator('#login-header');
    await expect(loginHeading).toBeVisible({ timeout: 5000 });

    // Verify page is not empty
    const bodyContent = await page.evaluate(() => {
      return document.body.textContent || '';
    });
    expect(bodyContent.length).toBeGreaterThan(50);

    // Check for navigation structure without being specific about content
    const hasNavElement = await page.evaluate(() => {
      return Boolean(
        document.querySelector('nav') ||
        document.querySelector('header') ||
        document.querySelector('[role="navigation"]')
      );
    });
    expect(hasNavElement).toBeTruthy();
  });
});
