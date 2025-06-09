import { test, expect } from '../utils/test-base';

/**
 * Dashboard tests with diagnostic logging
 *
 * These tests assume authentication is handled via the auth.setup.ts file
 */

test('authenticated user can access dashboard', async ({ page }) => {
  console.log('🧪 Starting dashboard test...');

  try {
    // Go to dashboard with extended timeout
    console.log('📄 Navigating to dashboard...');
    await page.goto('/dashboard', { timeout: 30000 });

    // Take screenshot for debugging
    await page.screenshot({ path: 'tests/e2e/screenshots/dashboard.png' });

    // Log the current state
    const url = page.url();
    console.log(`📊 Current URL: ${url}`);

    // Check if we're actually on the dashboard (not redirected to login)
    if (url.includes('/login')) {
      console.log('⚠️ Redirected to login - authentication may have failed');
      // Take detailed info to diagnose what went wrong
      await page.screenshot({ path: 'tests/e2e/screenshots/dashboard-auth-failed.png' });

      // Show auth-related localStorage items
      const storage = await page.evaluate(() => {
        const items: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key !== null) {
            const value = localStorage.getItem(key);
            items[key] = value !== null ? value : '';
          }
        }
        return items;
      });
      console.log('📊 LocalStorage state:', storage);

      // This will fail and correctly show the test as failed
      expect(url).not.toContain('/login');
    }

    // Log page content for debugging
    const content = await page.content();
    console.log(`📊 Page content length: ${content.length} characters`);

    // Basic visual check - find any header that might indicate we're on dashboard
    const dashboardHeader = page.locator('h1,h2,h3,h4').first();
    if (await dashboardHeader.isVisible()) {
      const headerText = await dashboardHeader.textContent();
      console.log(`📊 Found header: "${headerText}"`);
    } else {
      console.log('⚠️ No header found on page');
    }

    // Simple assertion - make sure we can at least find some content
    const body = page.locator('body');
    expect(await body.isVisible()).toBeTruthy();

    console.log('✅ Dashboard test completed successfully');
  } catch (error) {
    console.error('❌ Dashboard test failed:', error);
    await page.screenshot({ path: 'tests/e2e/screenshots/dashboard-error.png' });
    throw error;
  }
});
