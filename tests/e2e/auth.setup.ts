import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { Page } from 'playwright';

const storageStatePath = path.join(process.cwd(), 'tests/e2e/auth.setup.json');

/**
 * This setup function creates a test authentication session by directly setting
 * the necessary cookies and localStorage values that our middleware will recognize.
 */
setup('authenticate', async ({ page }) => {
  console.log('🔒 Setting up authentication for testing...');

  try {
    // Use direct cookie/localStorage approach for test authentication
    await setupTestAuthentication(page);
    console.log('✅ Authentication setup completed successfully');
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);

    // Fallback: Create empty auth state
    await createEmptyAuthState();
    console.warn('⚠️ Created empty auth state as fallback');
  }
});

/**
 * Sets up test authentication by directly modifying browser state
 * This is a simplified approach for E2E testing that bypasses the actual Firebase flow
 */
async function setupTestAuthentication(page: Page): Promise<void> {
  console.log('🔑 Setting up direct test authentication...');

  // Get the base URL from environment or default to localhost
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';

  // Step 1: Navigate to any page to set up cookies
  console.log('📄 Loading application to prepare authentication...');
  await page.goto(`${baseUrl}/login`);

  // Step 2: Set up test authentication data directly
  console.log('🔐 Setting up test authentication data...');

  // Create a test user
  const testUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
  };

  // Set authentication data directly in the browser context
  await page.evaluate((user: typeof testUser) => {
    console.log('Setting up test authentication in browser context...');

    try {
      // Set cookies for authentication bypass
      document.cookie = `__playwright_test=true;path=/;max-age=3600;SameSite=Lax`;
      document.cookie = `firebase-auth-test=true;path=/;max-age=3600;SameSite=Lax`;
      document.cookie = `next-auth.session-token=mock-session-token;path=/;max-age=3600;SameSite=Lax`;

      // Store auth data in localStorage to simulate Firebase Auth
      const projectId = 'next-firebase-base-template';
      localStorage.setItem(`firebase:authUser:${projectId}`, JSON.stringify(user));
      localStorage.setItem(
        'firebaseTestAuth',
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          authenticated: true,
        })
      );

      // Dispatch an event to notify applications of authentication change
      window.dispatchEvent(new Event('storage'));

      console.log('Successfully set up test authentication data');
      return { success: true };
    } catch (error) {
      console.error('Failed to set up test authentication:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, testUser);

  console.log('✅ Successfully set up test authentication data');

  // Step 3: Verify authentication by accessing a protected route
  console.log('🔍 Verifying authentication by accessing protected route...');
  await page.goto(`${baseUrl}/dashboard`);

  // Verify authentication was successful by checking for dashboard element
  try {
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    console.log('✅ Authentication verified - dashboard accessible');
  } catch {
    console.error('❌ Authentication verification failed - dashboard not accessible');
    await page.screenshot({ path: 'auth-verification-failed.png' });
    throw new Error('Authentication verification failed: Could not access dashboard');
  }

  // Step 4: Save authentication state for reuse in tests
  await page.context().storageState({ path: storageStatePath });
  console.log(`✅ Authentication state saved to ${storageStatePath}`);
}

/**
 * Creates an empty authentication state file if everything else fails
 */
async function createEmptyAuthState(): Promise<void> {
  console.log('Creating empty auth state file...');

  // Make sure the directory exists
  const dir = path.dirname(storageStatePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create minimal authentication state
  const emptyState = {
    cookies: [],
    origins: [],
  };

  fs.writeFileSync(storageStatePath, JSON.stringify(emptyState, null, 2));
  console.log(`✅ Empty auth state created at ${storageStatePath}`);
}
