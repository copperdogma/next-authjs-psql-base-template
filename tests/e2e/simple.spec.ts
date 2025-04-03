import { test, expect } from '@playwright/test';

/**
 * Ultra-simple test file for diagnosing Playwright issues
 */

test('basic smoke test', async ({ page }) => {
  console.log('Starting basic smoke test');

  try {
    // Navigate to the home page with a timeout
    console.log('Attempting to navigate to the home page...');
    await page.goto('/', { timeout: 15000 });
    console.log('Navigation complete');

    // Take a screenshot for debug purposes
    await page.screenshot({ path: 'tests/e2e/screenshots/basic-test.png' });

    // Simple checks
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Log some basic info about the page
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Simple assertion
    expect(title).toBeDefined();

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed with error:', error);
    // Take a screenshot on failure
    await page.screenshot({ path: 'tests/e2e/screenshots/error-state.png' });
    throw error;
  }
});
