import { test, expect } from '@playwright/test';
import { randomBytes } from 'crypto';

// Base URL is set in playwright.config.ts

test.describe('User Registration Flow', () => {
  test('should allow a new user to register and then log in', async ({ page, context }) => {
    // --- START: Clear existing auth state ---
    // Re-enable clearing state
    // Navigate to a blank page or base URL first to establish context
    await page.goto('/');
    // Clear cookies and local storage to ensure an unauthenticated state for this test
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    // Optional: Add a small wait or reload if needed, but often clearing is sufficient
    await page.reload({ waitUntil: 'domcontentloaded' }); // Added reload for good measure
    // --- END: Clear existing auth state ---

    // Generate unique credentials for this test run
    const uniqueId = randomBytes(4).toString('hex');
    const newUser = {
      name: `Test User ${uniqueId}`,
      email: `test-register-${uniqueId}@example.com`,
      password: `Password${uniqueId}!`,
    };

    // Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

    // Fill out the registration form
    await page.locator('#email').fill(newUser.email);
    await page.locator('#password').fill(newUser.password);
    await page.locator('#confirmPassword').fill(newUser.password);

    // Submit the form
    await page.getByRole('button', { name: /Register/i }).click();

    // 1. Wait for navigation to the dashboard URL
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Wait for a static element on the dashboard page to ensure it has loaded
    const overviewHeader = page.getByRole('heading', { name: 'Overview' });
    await expect(overviewHeader).toBeVisible({ timeout: 10000 });

    // 3. Explicitly wait for the profile loading skeleton to disappear
    console.log('[Test] Waiting for profile loading skeleton to disappear...');
    const loadingSkeleton = page.locator('[data-testid="profile-loading"]');
    await expect(loadingSkeleton).not.toBeVisible({ timeout: 15000 }); // Wait up to 15s for loading state to finish
    console.log('[Test] Profile loading skeleton disappeared.');

    // 4. Now check for the user profile element with a reasonable timeout
    console.log('[Test] Checking for final user profile element...');
    const profileElement = page.locator('[data-testid="user-profile-chip"]');
    await expect(profileElement).toBeVisible({ timeout: 10000 }); // Reduced timeout slightly, should appear quickly after loading
    console.log('[Test] User profile element is visible.');

    // Optional: Verify user details displayed if needed
    await expect(profileElement).toHaveText(newUser.email, { timeout: 15000 });

    // --- START: Check for Session Cookie ---
    console.log('Waiting for network idle after form submission...');
    await page.waitForLoadState('networkidle', { timeout: 5000 }); // Wait for server action
    console.log('Network idle. Checking cookies...');
    const cookies = await context.cookies();
    console.log('Cookies after registration attempt:', JSON.stringify(cookies, null, 2));
    // Adjust cookie name if necessary based on your NextAuth config (e.g., __Secure- prefix)
    const sessionCookieExists = cookies.some(cookie =>
      cookie.name.includes('next-auth.session-token')
    );
    console.log(`Session cookie found: ${sessionCookieExists}`);
    expect(sessionCookieExists, 'NextAuth session cookie should be set after registration').toBe(
      true
    );
    // --- END: Check for Session Cookie ---

    // Assertions after registration & automatic login
    // Expect redirection to the dashboard
    await page.waitForURL('**/dashboard'); // Wait for the dashboard URL
    await expect(page).toHaveURL('/dashboard'); // Confirm the dashboard URL

    // Log URL for verification
    const currentUrl = page.url();
    console.log(`Navigated to: ${currentUrl}`);

    // Add an explicit wait to allow session propagation/client update
    console.log('Adding explicit 2-second wait before checking profile...');
    await page.waitForTimeout(2000);
    console.log('Wait finished. Checking for profile button...');

    // Use a selector that confirms the user is logged in, e.g., the user profile button/menu
    // Increase timeout for the profile button check
    await expect(page.locator('[data-testid="user-profile-chip"]')).toBeVisible({ timeout: 15000 }); // Corrected selector

    // --- START: Enhanced Waits ---
    // Wait for the main layout/content to likely be stable
    await page.waitForURL('**/dashboard', { timeout: 10000 }); // Wait for URL
    // Explicitly wait for a key element on the dashboard page itself
    const dashboardHeading = page.locator('h1:has-text("Dashboard")');
    await expect(
      dashboardHeading,
      'Dashboard heading should be visible after redirect'
    ).toBeVisible({ timeout: 10000 });

    // --- END: Enhanced Waits ---

    // Now check for the user profile element, giving it time for session state to update
    console.log('Checking for profile button after dashboard heading is visible...'); // Use console.log in tests
    await expect(
      page.locator('[data-testid="user-profile-chip"]'),
      'User profile should be visible after dashboard loads'
    ).toBeVisible({ timeout: 15000 }); // Correct ID from UserProfile component

    // Check that we are indeed on the dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
