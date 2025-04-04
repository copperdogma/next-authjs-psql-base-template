import { test as setup } from '@playwright/test';
import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Constant for the storage state file path
export const STORAGE_STATE = 'playwright/.auth/user.json';

/**
 * Authentication setup for E2E testing with Next.js and Firebase Auth
 *
 * This sets up authentication state for tests requiring an authenticated user
 * using programmatic authentication via a test API endpoint.
 */

// Authentication setup script
// This runs before tests that require authentication

/**
 * Sets up authentication for tests that require it.
 * This script runs before tests with a dependency on 'setup'.
 */
setup('authenticate', async ({ page }) => {
  console.log('🔑 Running authentication setup...');

  try {
    // Verify the test server and emulators are available
    await checkTestServices(page);

    // Attempt programmatic authentication
    await setupViaProgrammaticLogin(page);
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    // Fallback: Create a minimal auth state file to prevent errors
    await createEmptyAuthState();
    throw error;
  }
});

/**
 * Verify that test services are running properly
 */
async function checkTestServices(page: Page): Promise<void> {
  // Check application health endpoint
  try {
    const healthResponse = await page.request.get('/api/health');
    if (!healthResponse.ok()) {
      throw new Error(`Health check failed: ${healthResponse.status()}`);
    }
    console.log('✅ Application health check passed');
  } catch (error) {
    console.error('❌ Application health check failed:', error);
    throw new Error('Test application server not responding');
  }
}

/**
 * Create an empty auth state file as a fallback
 */
async function createEmptyAuthState(): Promise<void> {
  const dir = path.dirname(STORAGE_STATE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
  console.warn('⚠️ Created empty auth state as fallback');
}

/**
 * Main setup function that uses programmatic login via test API.
 * This is faster and more reliable than UI-based authentication.
 */
async function setupViaProgrammaticLogin(page: Page): Promise<void> {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';

  // Call the test login API which will set the necessary cookies
  console.log('🔒 Using programmatic authentication via test API endpoint...');

  try {
    // First verify we can reach the test login API
    const testLoginUrl = `${baseUrl}/api/auth/test-login`;

    // Check if the application already has the test login endpoint available
    const testLoginResponse = await page.request.get(testLoginUrl).catch(() => null);

    if (!testLoginResponse || !testLoginResponse.ok()) {
      console.warn('⚠️ Test login API not reachable via request, trying via navigation');
    }

    // Navigate to the test login endpoint (this will set cookies and redirect to dashboard)
    await page.goto('/api/auth/test-login', {
      waitUntil: 'networkidle',
      timeout: 10000,
    });

    console.log('📄 Redirected after authentication');

    // Take screenshot for debugging with timestamp to prevent overwrites
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `tests/e2e/screenshots/auth-setup-after-login-${timestamp}.png`,
    });

    // Check the current URL
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);

    // Verify we're on the dashboard or another authenticated page
    if (currentUrl.includes('/login')) {
      console.error('⚠️ Authentication setup may have failed - still on login page');
      await page.screenshot({ path: `tests/e2e/screenshots/auth-setup-failed-${timestamp}.png` });
      throw new Error(
        `Failed to authenticate - redirected to login page. Expected to be on dashboard but got: ${currentUrl}`
      );
    } else {
      console.log(`✅ Authentication verified - successfully redirected to ${currentUrl}`);
    }

    // Check if we have session cookies
    const cookies = await page.context().cookies();
    const hasSessionCookie = cookies.some(c => c.name === '__session' || c.name === 'mock_session');

    if (!hasSessionCookie) {
      console.warn('⚠️ No session cookie found, authentication may be incomplete');
    } else {
      console.log('✅ Session cookie verified');
    }

    // Save authentication state
    await page.context().storageState({ path: STORAGE_STATE });
    console.log(`💾 Authentication state saved to ${STORAGE_STATE}`);
  } catch (error) {
    console.error('❌ Test login navigation failed:', error);

    // Fallback: try to create a mock session directly
    console.warn('⚠️ Attempting to create a mock session directly');

    // Save a basic auth state for test continuation
    await createEmptyAuthState();

    throw error;
  }
}

// For backward compatibility, keep the UI login method but don't use it by default
// This function is intentionally unused but kept for reference purposes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function setupViaUILogin(page: Page): Promise<void> {
  // Navigate to login page
  await page.goto('/login', { waitUntil: 'networkidle', timeout: 10000 });

  // Additional UI login logic (kept for reference)
  // ...
}

// Note: This module only exports the authentication setup
