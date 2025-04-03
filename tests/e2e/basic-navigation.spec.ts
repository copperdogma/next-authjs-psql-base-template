import { test, expect } from '@playwright/test';

test('basic navigation - can access the homepage', async ({ page }) => {
  console.log('🧪 Starting basic navigation test');
  try {
    // Navigate to home page with additional options for reliability
    console.log('🌐 Navigating to homepage...');
    const response = await page.goto('/', {
      timeout: 30000,
      waitUntil: 'networkidle',
    });

    console.log(`📡 Response status: ${response?.status()}`);
    console.log(`📡 Response URL: ${response?.url()}`);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'tests/e2e/screenshots/homepage.png' });

    // Log page details
    const url = page.url();
    const title = await page.title();
    console.log(`📄 Current URL: ${url}`);
    console.log(`📄 Page title: ${title}`);

    // Very basic assertions that should always pass if the page loads
    expect(title).toBeDefined();
    await expect(page.locator('body')).toBeVisible();

    // Log HTML content length for debugging
    const content = await page.content();
    console.log(`📝 HTML content length: ${content.length} characters`);

    // Check for basic elements
    const headingCount = await page.locator('h1, h2, h3, h4, h5, h6').count();
    console.log(`🔍 Found ${headingCount} heading elements`);

    if (headingCount > 0) {
      for (let i = 0; i < headingCount; i++) {
        const headingText = await page.locator('h1, h2, h3, h4, h5, h6').nth(i).textContent();
        console.log(`🔍 Heading ${i + 1}: ${headingText}`);
      }
    }

    // Log if we can see any links on the page
    const linkCount = await page.locator('a').count();
    console.log(`🔍 Found ${linkCount} link elements`);

    // Success!
    console.log('✅ Basic navigation test completed successfully');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    throw error;
  }
});
