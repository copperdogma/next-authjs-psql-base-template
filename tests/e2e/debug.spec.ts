import { test as base, chromium, expect } from '@playwright/test';
import { ROUTES } from '../utils/routes';

// Configuration for debug tests
const DEBUG_CONFIG = {
  TEST_SERVER_PORT: 3001,
  TEST_SERVER_URL: 'http://localhost:3001',
  TIMEOUT: 60000,
  SCREENSHOT_PATH: 'tests/e2e/screenshots/debug-screenshot.png'
};

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
  
  // Use the configuration constant instead of hardcoding
  console.log('Navigating to home page via direct URL');
  await page.goto(DEBUG_CONFIG.TEST_SERVER_URL, { timeout: DEBUG_CONFIG.TIMEOUT });
  
  // Log the current URL
  console.log('Current URL:', page.url());
  
  // Take a screenshot for debugging - save to gitignored screenshots directory
  await page.screenshot({ path: DEBUG_CONFIG.SCREENSHOT_PATH });
  console.log(`Screenshot saved to ${DEBUG_CONFIG.SCREENSHOT_PATH}`);
  
  // Simple assertion that should work
  console.log('Checking for page content');
  await expect(page.locator('body')).toBeVisible();
  
  console.log('Test completed successfully');
});

// Completely skip the test file if you don't want to run it
test.skip('debug test - basic navigation', async ({ page }) => {
  console.log('Starting debug test');
  
  // Navigate to the home page using the route constant
  console.log('Navigating to home page');
  await page.goto(ROUTES.HOME);
  
  // Log the current URL
  console.log('Current URL:', page.url());
  
  // Take a screenshot for debugging - save to gitignored screenshots directory
  await page.screenshot({ path: DEBUG_CONFIG.SCREENSHOT_PATH });
  console.log(`Screenshot saved to ${DEBUG_CONFIG.SCREENSHOT_PATH}`);
  
  // Use more resilient title check that doesn't rely on exact text
  console.log('Checking for page title');
  // Look for any title that contains "Next"
  await expect(page).toHaveTitle(/Next/i);
  
  console.log('Test completed successfully');
});

// This test is intentionally skipped as it's only for manual debugging purposes
// It's a duplicate of the test above but uses the routing system instead of direct URL
// Uncomment the line below and comment out test.skip to run this test manually when needed
test.skip('debug test - alternative navigation (intentionally skipped)', async ({ page }) => {
  console.log('Starting debug test');
  
  // Navigate to the home page
  console.log('Navigating to home page');
  await page.goto(ROUTES.HOME);
  
  // Log the current URL
  console.log('Current URL:', page.url());
  
  // Take a screenshot for debugging - save to gitignored screenshots directory
  await page.screenshot({ path: DEBUG_CONFIG.SCREENSHOT_PATH });
  console.log(`Screenshot saved to ${DEBUG_CONFIG.SCREENSHOT_PATH}`);
  
  // Use more resilient title check that doesn't rely on exact text
  console.log('Checking for page title');
  // Look for any title that contains "Next"
  await expect(page).toHaveTitle(/Next/i);
  
  console.log('Test completed successfully');
}); 