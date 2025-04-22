import { test as setup, expect, type Page } from '@playwright/test';
import path from 'path';

const STORAGE_STATE = path.join(__dirname, '../../.auth/user.json');
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';
const LOGIN_URL = `${BASE_URL}/login`;
const DASHBOARD_URL = `${BASE_URL}/dashboard`; // Or another protected route where users land after login

setup.describe('Authentication Setup via UI Login', () => {
  setup.setTimeout(60000); // Standard timeout

  setup('authenticate via credentials', async ({ page }) => {
    console.log('🚀 Starting authentication setup via UI login...');

    const email = process.env.TEST_E2E_EMAIL;
    const password = process.env.TEST_E2E_PASSWORD;

    if (!email || !password) {
      throw new Error('TEST_E2E_EMAIL or TEST_E2E_PASSWORD environment variables not set in .env.test');
    }

    // 1. Go to login page
    console.log(` Navigating to login page: ${LOGIN_URL}`);
    await page.goto(LOGIN_URL);

    // 2. Fill in credentials using data-testid attributes (assuming they exist)
    console.log(` Filling credentials for: ${email}`);
    await page.locator('[data-testid="login-email"]').fill(email);
    await page.locator('[data-testid="login-password"]').fill(password);

    // 3. Click submit button (assuming it has a data-testid)
    console.log(' Clicking submit button...');
    await page.locator('[data-testid="login-submit"]').click();

    // 4. Wait for successful login confirmation
    //    Wait for redirect to a protected page (e.g., dashboard)
    console.log(` Waiting for successful navigation to ${DASHBOARD_URL}...`);
    await page.waitForURL(DASHBOARD_URL, { timeout: 15000 }); // Adjust timeout as needed
    //    Alternatively, wait for a specific element only visible when logged in:
    //    await expect(page.locator('#user-profile-menu')).toBeVisible({ timeout: 15000 });

    console.log(`✅ Successfully logged in and navigated to ${page.url()}`);

    // 5. Save storage state FROM THE PAGE CONTEXT
    //    This captures cookies set by Auth.js during the UI login flow.
    await page.context().storageState({ path: STORAGE_STATE });
    console.log(`💾 Authentication state saved to ${STORAGE_STATE}`);

    console.log('🎉 Authentication setup via UI Login complete!');
  });
});
