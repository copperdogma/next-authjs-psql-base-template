import { test as setup, expect } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.test variables if not already loaded by Playwright config
// It's safer to load them explicitly here as well.
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test'), override: false });

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

const STORAGE_STATE = path.join(__dirname, '../../.auth/user.json');
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';
// Auth.js default sign-in page path (adjust if custom pages are configured)
const SIGN_IN_URL = `${BASE_URL}/api/auth/signin`;
const EXPECTED_POST_LOGIN_PATHS = ['/', '/dashboard']; // Accept either home or dashboard after login

setup.describe('Authentication Setup via Credentials Provider', () => {
  setup.setTimeout(90000); // Increase timeout for potential slow first loads/compilations

  setup('authenticate via test credentials', async ({ page }) => {
    console.log('🚀 Starting authentication setup via E2E Credentials Provider...');

    // --- Pre-checks ---
    if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
      throw new Error(
        'TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables not set. Check .env.test'
      );
    }
    console.log(` Using Test Email: ${TEST_USER_EMAIL}`);
    // --- End Pre-checks ---

    try {
      // Navigate to the Sign-in page
      console.log(` Navigating to Sign-in URL: ${SIGN_IN_URL}`);
      await page.goto(SIGN_IN_URL, { waitUntil: 'domcontentloaded' });
      console.log(` Current URL: ${page.url()}`);

      // Wait for the E2E Test Login form elements
      console.log(' Waiting for E2E Test Login form elements...');
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      const csrfInput = page.locator('input[name="csrfToken"]');
      const signInButton = page.getByRole('button', { name: 'Sign in with E2E Test Login' });

      // Wait for inputs to be ready
      await emailInput.waitFor({ state: 'visible', timeout: 15000 });
      await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
      await csrfInput.waitFor({ state: 'attached', timeout: 15000 });
      await signInButton.waitFor({ state: 'visible', timeout: 15000 });
      console.log('✅ Form elements located');

      // Fill in credentials
      console.log(' Filling credentials...');
      await emailInput.fill(TEST_USER_EMAIL);
      await passwordInput.fill(TEST_USER_PASSWORD);

      // Click sign in and wait for redirect
      console.log(' Clicking Sign In button...');
      await signInButton.click();

      // Wait for navigation
      console.log(' Waiting for navigation after login...');
      // This pattern gives us more flexibility than Promise.all, which can be fragile
      await page.waitForNavigation({ timeout: 15000 });

      const currentUrl = page.url();
      console.log(` Current URL after login: ${currentUrl}`);

      // Check for error in URL
      if (currentUrl.includes('error=')) {
        const errorCode = new URL(currentUrl).searchParams.get('error');
        throw new Error(`Login failed with error: ${errorCode}`);
      }

      // Check if we're on an expected page
      const currentPath = new URL(currentUrl).pathname;
      if (!EXPECTED_POST_LOGIN_PATHS.includes(currentPath)) {
        throw new Error(`Login did not redirect to expected page. Current URL: ${currentUrl}`);
      }

      // Verify successful login by checking session
      console.log(' Verifying successful login by checking session state...');

      // Navigate to a page that shows login state clearly
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

      // Wait for page to settle
      await page.waitForLoadState('networkidle');

      // Check for the UserProfile component rendering, indicating login success
      // Use a longer timeout to allow for hydration
      try {
        await expect(page.locator('[data-testid="user-profile"]')).toBeVisible({ timeout: 20000 }); // Increased timeout to 20s
      } catch (e) {
        // Take screenshot for debugging
        const screenshotPath = path.join(
          __dirname,
          `../../test-results/auth-verification-failed-${Date.now()}.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.error(
          'Login verification failed: User profile element not visible after 20 seconds.',
          e
        );
        throw new Error(
          `Login verification failed. Unable to detect logged in state via [data-testid="user-profile"].`
        );
      }

      console.log('✅ Login verification successful - user appears to be logged in');

      // Save storage state
      await page.context().storageState({ path: STORAGE_STATE });
      console.log(`💾 Authentication state saved to ${STORAGE_STATE}`);
      console.log('🎉 Authentication setup via form-based login complete!');
    } catch (error) {
      console.error('❌ Authentication setup failed:', error);
      // Capture screenshot on failure
      const screenshotPath = path.join(
        __dirname,
        `../../test-results/auth-setup-failure-${Date.now()}.png`
      );
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot saved to ${screenshotPath}`);
      } catch (ssError) {
        console.error(`Failed to take screenshot: ${String(ssError)}`);
      }
      throw error; // Re-throw the original error to fail the setup
    }
  });
});
