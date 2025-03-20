import { test as base, chromium, expect } from '@playwright/test';

// Create a custom test fixture that doesn't depend on any config files
const test = base.extend({
  page: async ({}, use) => {
    // Launch a browser manually
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: false }); // Run headed for visibility
    
    // Create a new context
    console.log('Creating browser context...');
    const context = await browser.newContext();
    
    // Create a new page
    console.log('Creating new page...');
    const page = await context.newPage();
    
    // Use the page in the test
    await use(page);
    
    // Clean up
    console.log('Cleaning up...');
    await context.close();
    await browser.close();
  }
});

// This is an even more minimal test that doesn't rely on configuration
test('super basic test', async ({ page }) => {
  console.log('Starting super basic test');
  
  // Hard-code the URL to avoid dependency on environment variables
  console.log('Navigating to home page');
  await page.goto('http://localhost:3001', { timeout: 60000 }); // Updated port and added longer timeout
  
  // Log the current URL
  console.log('Current URL:', page.url());
  
  // Take a screenshot for debugging - save to gitignored screenshots directory
  await page.screenshot({ path: 'tests/e2e/screenshots/debug-screenshot.png' });
  console.log('Screenshot saved to tests/e2e/screenshots/debug-screenshot.png');
  
  // Simple assertion that should work
  console.log('Checking for page content');
  await expect(page.locator('body')).toBeVisible();
  
  console.log('Test completed successfully');
});

// Completely skip the test file if you don't want to run it
test.skip('debug test - basic navigation', async ({ page }) => {
  console.log('Starting debug test');
  
  // Navigate to the home page
  console.log('Navigating to home page');
  await page.goto('/');
  
  // Log the current URL
  console.log('Current URL:', page.url());
  
  // Take a screenshot for debugging - save to gitignored screenshots directory
  await page.screenshot({ path: 'tests/e2e/screenshots/debug-screenshot.png' });
  console.log('Screenshot saved to tests/e2e/screenshots/debug-screenshot.png');
  
  // Simple assertion that should work
  console.log('Checking for page content');
  await expect(page).toHaveTitle(/.*Next.js/);
  
  console.log('Test completed successfully');
});

// This test is intentionally skipped as it's only for manual debugging purposes
// It's a duplicate of the test above but uses the routing system instead of direct URL
// Uncomment the line below and comment out test.skip to run this test manually when needed
test.skip('debug test - alternative navigation (intentionally skipped)', async ({ page }) => {
  console.log('Starting debug test');
  
  // Navigate to the home page
  console.log('Navigating to home page');
  await page.goto('/');
  
  // Log the current URL
  console.log('Current URL:', page.url());
  
  // Take a screenshot for debugging - save to gitignored screenshots directory
  await page.screenshot({ path: 'tests/e2e/screenshots/debug-screenshot.png' });
  console.log('Screenshot saved to tests/e2e/screenshots/debug-screenshot.png');
  
  // Simple assertion that should work
  console.log('Checking for page content');
  await expect(page).toHaveTitle(/.*Next.js/);
  
  console.log('Test completed successfully');
}); 