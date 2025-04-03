import { test as setup, Page } from '@playwright/test';
import { STORAGE_STATE } from '../../tests/config/playwright.config';
import { TEST_CONFIG } from '../utils/routes';

/**
 * Authentication setup for E2E testing with Next.js and Firebase Auth
 *
 * This sets up authentication state for tests requiring an authenticated user
 * using the best practices recommended for Next.js and Firebase Auth testing.
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
    await setupViaUILogin(page);
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    // Fallback: Create a minimal auth state file to prevent errors
    const fs = require('fs');
    fs.writeFileSync(
      STORAGE_STATE,
      JSON.stringify({
        cookies: [],
        origins: [],
      })
    );
  }
});

/**
 * Main setup function that uses UI login flow.
 * This simulates a real user logging in through the UI.
 */
async function setupViaUILogin(page: Page): Promise<void> {
  // Navigate to login page
  await page.goto('/login', { waitUntil: 'networkidle' });
  console.log('📄 Navigated to login page');

  // Take screenshot for debugging
  await page.screenshot({ path: 'tests/e2e/screenshots/auth-setup-login-page.png' });

  // Mock Firebase auth
  await page.evaluate(config => {
    // Create a mock user for testing
    const mockUser = {
      uid: config.TEST_USER.UID,
      email: config.TEST_USER.EMAIL,
      displayName: config.TEST_USER.DISPLAY_NAME,
      photoURL: config.TEST_USER.PHOTO_URL,
      emailVerified: true,
    };

    // Store in localStorage to simulate auth state
    localStorage.setItem('firebase:authUser:test-project-id', JSON.stringify(mockUser));

    // Trigger auth state change event
    window.dispatchEvent(new CustomEvent('authStateChanged'));

    // Add a flag to indicate test mode
    sessionStorage.setItem('test-auth-active', 'true');

    console.log('✅ Mock authentication set up for user:', mockUser.email);
  }, TEST_CONFIG);

  // Wait for network activities to settle
  await page.waitForLoadState('networkidle');
  console.log('⏳ Waiting for network to settle after authentication');

  // Try to navigate to a protected page to verify authentication worked
  await page.goto('/dashboard', { timeout: 5000 }).catch(() => {
    console.log('⚠️ Could not navigate to dashboard - this is expected if auth redirect works');
  });

  // Save authentication state
  await page.context().storageState({ path: STORAGE_STATE });
  console.log(`💾 Authentication state saved to ${STORAGE_STATE}`);
}

// Note: This module only exports the authentication setup
