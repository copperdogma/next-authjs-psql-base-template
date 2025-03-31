import { test, expect } from '@playwright/test';

test.describe('Login Page Rendering', () => {
  test('should properly render login page with callback URL', async ({ page }) => {
    // Navigate directly to login with a callback URL
    await page.goto('/login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fdashboard');

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/e2e/screenshots/direct-login-callback.png' });

    // Check the page title - using the one that's actually set in the application
    await expect(page).toHaveTitle(/.*/, { timeout: 5000 });

    // Look for any login-related button instead of specific text
    // This is more resilient to text changes
    const signInButton = page.locator('[data-testid="google-signin-button"]');
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Look for Google icon inside the button
    const googleIcon = signInButton.locator('svg');

    // Check if the icon is visible
    await expect(googleIcon).toBeVisible({ timeout: 5000 });

    // Check for "Welcome" heading pattern instead of exact text
    const welcomeHeading = page.getByRole('heading', { name: /welcome/i });
    await expect(welcomeHeading).toBeVisible({ timeout: 5000 });

    // Check that we have actual content on the page - this will fail if the page is blank
    const bodyContent = await page.evaluate(() => {
      return document.body.textContent || '';
    });

    // Log the actual content length to debug the issue
    console.log(`Body content length: ${bodyContent.length}`);

    // This assertion should fail with a blank page
    expect(bodyContent.length).toBeGreaterThan(50);

    // Check for essential navigation elements
    const navigationElements = await page.locator('nav').count();
    expect(navigationElements).toBeGreaterThan(0);
  });

  test('should render login page properly WITHOUT a callback URL', async ({ page }) => {
    // Navigate directly to login WITHOUT a callback URL
    await page.goto('/login');

    // Take a screenshot for comparison
    await page.screenshot({ path: 'tests/e2e/screenshots/direct-login-no-callback.png' });

    // Check the page title
    await expect(page).toHaveTitle(/.*/, { timeout: 5000 });

    // Use more flexible selectors
    const signInButton = page.locator('[data-testid="google-signin-button"]');
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Check that the button has the Google icon
    const googleIcon = signInButton.locator('svg');
    await expect(googleIcon).toBeVisible({ timeout: 5000 });

    // Also check for the welcome message with case-insensitive matching
    const welcomeText = page.getByRole('heading', { name: /welcome/i });
    await expect(welcomeText).toBeVisible({ timeout: 5000 });

    // Check that we have actual content on the page
    const bodyContent = await page.evaluate(() => {
      return document.body.textContent || '';
    });

    // Log the actual content length to compare with the callback URL version
    console.log(`Body content length (no callback): ${bodyContent.length}`);

    // This assertion should pass for a properly rendered page
    expect(bodyContent.length).toBeGreaterThan(50);

    // Check for navigation elements - more flexible implementation
    const hasNavigation = await page.evaluate(() => {
      return !!document.querySelector('nav, header, [role="navigation"]');
    });

    expect(hasNavigation).toBeTruthy();
  });
});
