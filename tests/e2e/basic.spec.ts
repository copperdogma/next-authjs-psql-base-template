import { test, expect } from './utils/test-base';

/**
 * Ultra-simple test to verify the testing infrastructure works
 * This test should pass regardless of application state
 */
test('basic website accessibility', async ({ page }) => {
  // Show what we're doing
  console.log('🧪 Running basic test to verify testing infrastructure');

  try {
    // Go to the homepage with extended timeout
    console.log('📄 Navigating to homepage...');
    await page.goto('/', { timeout: 30000 });

    // Take a screenshot for debugging
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'tests/e2e/screenshots/home-basic.png' });

    // Log page info
    const url = page.url();
    const title = await page.title();
    console.log(`📊 Current URL: ${url}`);
    console.log(`📊 Page title: ${title}`);

    // Basic assertion that should always pass - we just want to confirm the page loaded
    const body = page.locator('body');
    expect(await body.isVisible()).toBeTruthy();
    console.log('✅ Test successful - page body is visible');

    // Show what elements are on the page for debugging
    const html = await page.content();
    console.log(`📊 Page content length: ${html.length} chars`);
    console.log(`📊 Page content snippet: ${html.substring(0, 500)}...`);
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'tests/e2e/screenshots/home-basic-error.png' });
    throw error;
  }
});
