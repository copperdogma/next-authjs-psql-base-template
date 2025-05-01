import { test as setup, expect, type Page } from '@playwright/test';
import path from 'path';
import { STORAGE_STATE } from '../../../playwright.config'; // Keep this one
import dotenv from 'dotenv';
import { ROUTES } from '../../utils/routes';

// Load environment variables from .env.test
// Use override: false to avoid overwriting existing process vars if needed
// Ensure the path is correct relative to the current file
dotenv.config({ path: path.resolve(__dirname, '../../../.env.test'), override: false });

// Define test user credentials
const testUserEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
const testUserPassword = process.env.TEST_USER_PASSWORD || 'Test123!';

// Base URL for the application under test
// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'; // REMOVED - Rely on Playwright's baseURL
// Removed unused SIGN_IN_URL

const EXPECTED_POST_LOGIN_PATHS = ['/', '/dashboard']; // Accept either home or dashboard after login

// --- Helper Functions ---

async function navigateToLoginAndVerifyForm(page: Page): Promise<void> {
  console.log(` Navigating to Login Route: ${ROUTES.LOGIN}`);
  await page.goto(ROUTES.LOGIN, { waitUntil: 'networkidle', timeout: 20000 });
  console.log(` Current URL: ${page.url()}`);

  const signInButton = page.locator('button:has-text("Sign In with Email")');
  console.log(' Waiting for Sign In button to be visible...');
  await signInButton.waitFor({ state: 'visible', timeout: 20000 });
  console.log('✅ Sign In button located');

  const emailInput = page.locator('#email');
  const passwordInput = page.locator('#password');
  await expect(emailInput, 'Email input should be visible').toBeVisible({ timeout: 5000 });
  await expect(passwordInput, 'Password input should be visible').toBeVisible({
    timeout: 5000,
  });
  console.log('✅ Form elements located');
}

async function fillAndSubmitLoginForm(page: Page, email: string, password: string): Promise<void> {
  console.log(' Filling credentials...');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  console.log(' Clicking Sign In button...');
  await page.locator('button:has-text("Sign In with Email")').click();
}

async function waitForSuccessfulLoginRedirect(page: Page): Promise<void> {
  console.log(' Waiting for navigation after login...');
  await page.waitForURL(url => EXPECTED_POST_LOGIN_PATHS.some(p => url.pathname === p), {
    timeout: 15000,
  });

  const currentUrl = page.url();
  console.log(` Current URL after login: ${currentUrl}`);

  if (currentUrl.includes('error=')) {
    const errorCode = new URL(currentUrl).searchParams.get('error');
    throw new Error(`Login might have failed with error in URL: ${errorCode}`);
  }
}

async function verifyLoggedInState(page: Page): Promise<void> {
  console.log(' Verifying successful login by checking UI state...');
  // Navigate to DASHBOARD to verify session is really working for protected routes
  console.log(` Navigating to ${ROUTES.DASHBOARD} for verification...`);
  await page.goto(ROUTES.DASHBOARD, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForLoadState('networkidle'); // Extra wait just in case

  console.log(` Current URL after navigating to dashboard: ${page.url()}`);

  // Check we are actually on the dashboard
  if (!page.url().endsWith(ROUTES.DASHBOARD)) {
    throw new Error(
      `Login verification failed. Expected to be on ${ROUTES.DASHBOARD} but ended up at ${page.url()}`
    );
  }

  try {
    // Verify dashboard heading is visible
    const dashboardHeading = page.locator('h1:has-text("Dashboard")');
    await expect(dashboardHeading, 'Dashboard heading should be visible').toBeVisible({
      timeout: 20000,
    });
    console.log('✅ Dashboard heading visible.');

    // Verify user profile element is visible (redundant but safe)
    await expect(
      page.locator('[data-testid="user-profile-chip"]'),
      'User profile chip should be visible'
    ).toBeVisible({ timeout: 5000 });
    console.log('✅ User profile chip visible.');

    // Check for session cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      c =>
        c.name.startsWith('next-auth.session-token') ||
        c.name.startsWith('__Secure-next-auth.session-token')
    );
    if (!sessionCookie) {
      console.error(
        'Login verification failed: NextAuth session cookie missing after dashboard load.'
      );
      console.log('Cookies found:', JSON.stringify(cookies, null, 2));
      throw new Error('Login verification failed: Session cookie missing.');
    }
    console.log(`✅ Found session cookie: ${sessionCookie.name}`);
  } catch (e) {
    // Take screenshot for debugging
    const screenshotPath = path.join(
      __dirname, // Use __dirname directly
      `../../test-results/auth-verification-failed-${Date.now()}.png`
    );
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error(`📸 Screenshot saved to ${screenshotPath}`);
    } catch (ssError) {
      console.error(`Failed to take screenshot: ${String(ssError)}`);
    }
    console.error(
      'Login verification failed: Could not verify elements or cookie on dashboard.',
      e
    );
    // Re-throw the original error or a more specific one
    throw new Error(
      `Login verification failed. Could not verify elements or cookie on dashboard. Original error: ${e}`
    );
  }
  console.log('✅ Login verification successful - user appears to be logged in on dashboard');
}

async function saveStorageState(page: Page, storagePath: string): Promise<void> {
  await page.context().storageState({ path: storagePath });
  console.log(`💾 Authentication state saved to ${storagePath}`);
}

// --- End Helper Functions ---

setup.describe('Authentication Setup via Credentials Provider', () => {
  setup.setTimeout(90000); // Increase timeout

  setup('authenticate via test credentials', async ({ page }) => {
    console.log('🚀 Starting authentication setup via Credentials Provider (UI Form)...');

    // --- Pre-checks ---
    if (!testUserEmail || !testUserPassword) {
      throw new Error(
        'TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables not set. Check .env.test'
      );
    }
    console.log(` Using Test Email: ${testUserEmail}`);
    // --- End Pre-checks ---

    try {
      // Call the helper function
      await navigateToLoginAndVerifyForm(page);

      // Call the new helper function
      await fillAndSubmitLoginForm(page, testUserEmail, testUserPassword);

      // Call the new helper function
      await waitForSuccessfulLoginRedirect(page);

      console.log(' Signed in successfully via credentials.');

      // Add a short delay to allow session propagation
      console.log(' Waiting for 1 second for session to propagate...');
      await page.waitForTimeout(1000);

      // Verify login state
      await verifyLoggedInState(page);
      console.log('✅ Login state verified.');

      // Call the new helper function
      await saveStorageState(page, STORAGE_STATE);

      console.log('🎉 Authentication setup via form-based login complete!');
    } catch (error) {
      console.error(
        'Authentication with credentials failed:',
        error instanceof Error ? error.message : String(error)
      );
      // Take screenshot if error occurs during login process
      const screenshotPath = path.join(
        __dirname, // Use __dirname directly
        `../../test-results/auth-login-failed-${Date.now()}.png`
      );
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.error(`📸 Login failure screenshot saved to ${screenshotPath}`);
      } catch (ssError) {
        console.error(`Failed to take screenshot: ${String(ssError)}`);
      }
      throw new Error(`Authentication with credentials failed: ${error}`);
    }
  });
});
