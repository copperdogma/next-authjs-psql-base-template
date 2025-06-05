import { test, expect } from '@playwright/test';
import { ROUTES } from '../../utils/routes';
import { UI_ELEMENTS } from './auth-selectors';
import {
  takeMobileScreenshot,
  takeMobileErrorScreenshot,
} from '../utils/mobile-screenshot-helpers';

/**
 * Mobile-specific auth tests
 * These tests verify authentication flows work correctly on mobile devices
 */
test.describe('Mobile Authentication', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies to ensure we start unauthenticated
    await context.clearCookies();
  });

  test('mobile login flow', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'Test123!';

    // Navigate to login page
    await page.goto(`${baseUrl}/login`);
    await takeMobileScreenshot(page, 'login-page.png');

    try {
      // Fill in credentials form
      const emailInput = page.locator(UI_ELEMENTS.AUTH.EMAIL_INPUT);
      const passwordInput = page.locator(UI_ELEMENTS.AUTH.PASSWORD_INPUT);
      const signInButton = page.locator(UI_ELEMENTS.AUTH.CREDENTIALS_SUBMIT);

      await emailInput.waitFor({ state: 'visible', timeout: 15000 });
      await emailInput.fill(testEmail);
      await passwordInput.fill(testPassword);

      // Take screenshot before submitting
      await takeMobileScreenshot(page, 'pre-login.png');

      // Submit login form
      await signInButton.click();

      // Wait for navigation to dashboard after successful login
      await page.waitForURL(`${baseUrl}${ROUTES.DASHBOARD}`, { timeout: 20000 });

      // Take post-login screenshot
      await takeMobileScreenshot(page, 'post-login.png');

      // Verify we're logged in by checking for dashboard content
      const dashboardIndicator = page.locator(
        'h1, [data-testid="dashboard-heading"], [data-testid="dashboard-content"]'
      );
      await expect(dashboardIndicator).toBeVisible({ timeout: 10000 });

      console.log('✅ Mobile login successful - user is on the dashboard.');
    } catch (error) {
      console.error('❌ Mobile login test failed:', error);
      await takeMobileErrorScreenshot(page, 'login-error');
      throw error;
    }
  });

  test('mobile auth setup', async ({ page, context }) => {
    // This test is specifically for setting up auth state for other mobile tests
    try {
      const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';
      const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
      const testPassword = process.env.TEST_USER_PASSWORD || 'Test123!';

      // Navigate to login page
      await page.goto(`${baseUrl}/login`);

      // Fill credentials form
      const emailInput = page.locator(UI_ELEMENTS.AUTH.EMAIL_INPUT);
      const passwordInput = page.locator(UI_ELEMENTS.AUTH.PASSWORD_INPUT);
      const signInButton = page.locator(UI_ELEMENTS.AUTH.CREDENTIALS_SUBMIT);

      await emailInput.waitFor({ state: 'visible', timeout: 15000 });
      await emailInput.fill(testEmail);
      await passwordInput.fill(testPassword);
      await signInButton.click();

      // Wait for successful login
      await page.waitForURL(`${baseUrl}${ROUTES.DASHBOARD}`, { timeout: 20000 });

      // Verify login was successful
      await expect(page.locator('body')).toContainText('Dashboard', { timeout: 10000 });

      // Save auth state for future tests
      await context.storageState({ path: 'tests/.auth/mobile-user.json' });
      console.log('✅ Mobile auth setup completed successfully');
    } catch (error) {
      console.error('❌ Mobile auth setup failed:', error);
      await takeMobileErrorScreenshot(page, 'auth-setup-failure');
      throw error;
    }
  });
});
