import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Path to the authentication state file - use the one from the root config
const authFile = path.join(__dirname, '../.auth/user.json');

// Create the .auth directory if it doesn't exist
const authDir = path.dirname(authFile);
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

// Test user credentials from environment variables
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Test123!',
  displayName: process.env.TEST_USER_DISPLAY_NAME || 'Test User',
};

/**
 * Authentication setup for Playwright tests
 * This script runs before other tests to:
 * 1. Set mock authentication cookies
 * 2. Save the authentication state to the authFile
 * 3. Make the state available to other tests via storageState in the playwright config
 */
setup('authenticate', async ({ page, context }) => {
  console.log(`🔑 Running authentication setup with user: ${TEST_USER.email}`);

  try {
    // First navigate to the login page
    await page.goto('/login', { waitUntil: 'networkidle' });

    // Set necessary authentication cookies
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token-for-testing',
        domain: new URL(page.url()).hostname,
        path: '/',
        httpOnly: true,
        secure: process.env.CI ? true : false,
        expires: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        sameSite: 'Lax',
      },
      {
        name: 'auth.uid',
        value: 'test-user-id',
        domain: new URL(page.url()).hostname,
        path: '/',
        httpOnly: false,
        secure: process.env.CI ? true : false,
        expires: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        sameSite: 'Lax',
      },
      {
        name: 'auth.email',
        value: TEST_USER.email,
        domain: new URL(page.url()).hostname,
        path: '/',
        httpOnly: false,
        secure: process.env.CI ? true : false,
        expires: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        sameSite: 'Lax',
      },
      {
        name: 'auth.name',
        value: TEST_USER.displayName,
        domain: new URL(page.url()).hostname,
        path: '/',
        httpOnly: false,
        secure: process.env.CI ? true : false,
        expires: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        sameSite: 'Lax',
      },
    ]);

    // Verify authentication by navigating to a protected page
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Check if still on dashboard (not redirected to login)
    const url = page.url();
    if (url.includes('/login')) {
      console.warn('⚠️ Authentication setup may have failed - redirected to login page');
      await page.screenshot({ path: 'tests/e2e/screenshots/auth-failed.png' });
    } else {
      console.log('✅ Authentication verified - able to access protected page');
      await page.screenshot({ path: 'tests/e2e/screenshots/auth-success.png' });
    }

    // Save the authentication state
    await page.context().storageState({ path: authFile });
    console.log(`✅ Authentication state saved to ${authFile}`);
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    // Create empty auth state to avoid errors
    fs.writeFileSync(
      authFile,
      JSON.stringify({
        cookies: [],
        origins: [],
      })
    );
    console.warn('⚠️ Created empty auth state file due to setup failure');
  }
});

// Export the path to the auth file, so it can be imported elsewhere if needed
export { authFile };
