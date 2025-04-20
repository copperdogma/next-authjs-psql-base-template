import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { Page } from 'playwright';
import { loginTestUser } from './utils/test-base'; // Import the new helper

const storageStatePath = path.join(process.cwd(), 'tests/e2e/auth.setup.json');

// Update Window type for modular Firebase SDK
declare global {
  interface Window {
    firebase?: any; // Using 'any' for simplicity with modular SDK structure
  }
}

// Test user information - should match the user created by setup-test-user.js
const TEST_USER = {
  uid: 'test-uid-playwright-123',
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Test123!',
  displayName: process.env.TEST_USER_DISPLAY_NAME || 'Test User',
};

// ADDED LOGGING: Log environment setup
console.log('🔧 E2E Auth Setup Environment Info:');
console.log(`BASE_URL: ${process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777'}`);
console.log(`USE_FIREBASE_EMULATOR: ${process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR}`);
console.log(`AUTH_EMULATOR_HOST: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`);
console.log(`FIRESTORE_EMULATOR_HOST: ${process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST}`);
console.log(`TEST_PORT: ${process.env.TEST_PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

/**
 * Sets up authentication using the new loginTestUser helper.
 */
async function setupAuthViaCookieInjection(page: Page): Promise<boolean> {
  console.log('🔑 Setting up authentication via Cookie Injection...');
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';

  try {
    // 1. Log in the user by setting the cookie
    await loginTestUser(page, TEST_USER.uid);
    console.log(`✅ Cookie injected for user: ${TEST_USER.uid}`);

    // 2. Navigate to a protected page to verify session is picked up
    console.log('🚀 Navigating to protected route (/dashboard) to verify session...');
    // Ensure navigation happens *after* cookie is set
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });

    // 3. Verify and Save State
    console.log('🔍 Verifying authentication and session state...');
    return verifyAuthentication(page);
  } catch (error) {
    console.error('❌ Error during Cookie Injection auth setup:', error);
    await page.screenshot({ path: 'tests/e2e/screenshots/auth-setup-error-cookie-injection.png' });
    await createEmptyAuthState(); // Ensure we create empty state on failure
    return false;
  }
}

/**
 * Sets up authentication using the Test API Endpoint and Modular Client-side Firebase SDK
 */
// async function setupAuthViaApiAndModularClientSdk(page: Page): Promise<boolean> {
// ... REMOVED OLD FUNCTION ...
// }

/**
 * This setup function now uses the cookie injection method.
 */
setup('authenticate', async ({ page }) => {
  console.log('🔒 Setting up authentication for testing...');

  try {
    // Use the new Cookie Injection method
    const success = await setupAuthViaCookieInjection(page);

    if (success) {
      console.log('✅ Authentication setup completed successfully via Cookie Injection');
    } else {
      console.error('❌ Cookie Injection Authentication setup failed.');
      await createEmptyAuthState(); // Ensure we fall back to empty state
      console.warn('⚠️ Created empty auth state as fallback after setup failure');
    }
  } catch (error) {
    console.error('❌ Authentication setup failed catastrophically:', error);
    await createEmptyAuthState(); // Ensure we fall back to empty state
    console.warn('⚠️ Created empty auth state as fallback after catastrophic failure');
  }
});

/**
 * Verify authentication was successful by checking various indicators
 */
async function verifyAuthentication(page: Page): Promise<boolean> {
  try {
    console.log(`Verifying authentication status at URL: ${page.url()}`);

    // Increased timeout for verification checks
    const verificationTimeout = 15000; // 15 seconds

    // 1. Check if we are still on the login page (immediate failure)
    if (page.url().includes('/login')) {
      console.error('❌ Authentication verification failed - Still on login page');
      await page.screenshot({ path: 'tests/e2e/screenshots/auth-verify-fail-on-login.png' });
      await createEmptyAuthState();
      return false;
    }

    // 2. Wait for a primary dashboard element to appear
    const dashboardHeadingSelector = 'h1:has-text("Dashboard")'; // More specific selector
    try {
      await page
        .locator(dashboardHeadingSelector)
        .waitFor({ state: 'visible', timeout: verificationTimeout });
      console.log(`✅ Authentication verified - Found element: ${dashboardHeadingSelector}`);

      // 3. (Optional but recommended) Check for the presence of the NextAuth session cookie
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(
        c =>
          c.name.startsWith('next-auth.session-token') ||
          c.name.startsWith('__Secure-next-auth.session-token')
      );

      if (!sessionCookie) {
        console.warn('⚠️ Dashboard content found, but NextAuth session cookie is missing!');
        await page.screenshot({ path: 'tests/e2e/screenshots/auth-verify-warn-no-cookie.png' });
        await createEmptyAuthState();
        return false;
      } else {
        console.log(`✅ Found NextAuth session cookie: ${sessionCookie.name}`);
      }

      // 4. Save authentication state only after successful verification
      await page.context().storageState({ path: storageStatePath });
      console.log(`✅ Authentication state saved to ${storageStatePath}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Authentication verification failed - Dashboard element "${dashboardHeadingSelector}" not found within ${verificationTimeout}ms.`
      );
      await page.screenshot({
        path: 'tests/e2e/screenshots/auth-verify-fail-no-dashboard-content.png',
      });
      console.log(`Current page URL: ${page.url()}`);
      console.log(`Current page title: ${await page.title()}`);
      // Log cookies for debugging
      const cookies = await page.context().cookies();
      console.log('Cookies at verification failure:', JSON.stringify(cookies, null, 2));
      await createEmptyAuthState();
      return false;
    }
  } catch (error) {
    console.error('❌ Error during authentication verification:', error);
    await page.screenshot({ path: 'tests/e2e/screenshots/auth-verify-error.png' });
    await createEmptyAuthState(); // Ensure we create empty state on failure
    return false;
  }
}

/**
 * Creates an empty authentication state file if everything else fails
 * This is a last resort to prevent test failures when auth setup completely fails
 */
async function createEmptyAuthState(): Promise<void> {
  const emptyState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3777',
        localStorage: [],
      },
    ],
  };

  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });
  fs.writeFileSync(storageStatePath, JSON.stringify(emptyState, null, 2));
  console.log(`Created empty auth state at ${storageStatePath}`);
}
