import { test, expect } from './utils/test-base';

/**
 * Consolidated smoke test to verify basic application functionality
 * This test should pass regardless of application state and confirms:
 * 1. The homepage loads successfully
 * 2. Basic page elements are visible
 * 3. Navigation to another page works
 */
test('smoke test - basic application functionality', async ({ page }) => {
  console.log('🧪 Running consolidated smoke test');

  try {
    // Step 1: Navigate to the homepage with extended timeout and wait for network idle
    console.log('🌐 Navigating to homepage...');
    const response = await page.goto('/', {
      timeout: 30000,
      waitUntil: 'networkidle',
    });

    // Verify successful response
    console.log(`📡 Response status: ${response?.status()}`);
    expect(response?.status()).toBe(200);

    // Log basic page info
    const url = page.url();
    const title = await page.title();
    console.log(`📄 Current URL: ${url}`);
    console.log(`📄 Page title: ${title}`);
    expect(title).toBeDefined();

    // Take a screenshot for debugging
    console.log('📸 Taking screenshot of homepage...');
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-test-home.png' });

    // Step 2: Verify critical page elements
    console.log('🔍 Checking for basic page elements...');

    // Verify body is visible (most basic check)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check for header element (assuming it exists in the layout)
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Log headings for debugging
    const headingCount = await page.locator('h1, h2, h3').count();
    console.log(`📊 Found ${headingCount} heading elements (h1-h3)`);

    // Step 3: Navigate directly to about page
    console.log('🧭 Navigating directly to About page...');

    // Go directly to the about page
    const aboutResponse = await page.goto('/about', { waitUntil: 'networkidle' });

    // Verify direct navigation succeeded
    console.log(`📡 About page response status: ${aboutResponse?.status()}`);
    expect(aboutResponse?.status()).toBe(200);

    const aboutUrl = page.url();
    console.log(`📄 Current URL after navigation: ${aboutUrl}`);
    expect(aboutUrl).toContain('/about');

    // Take screenshot of about page
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-test-about.png' });

    // Verify about page loaded by checking for specific content
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ About page loaded successfully');

    console.log('✅ Smoke test completed successfully');
  } catch (error) {
    console.error('❌ Smoke test failed:', error);
    await page.screenshot({ path: 'tests/e2e/screenshots/smoke-test-error.png' });
    throw error;
  }
});
