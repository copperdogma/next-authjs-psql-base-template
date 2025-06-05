// This is a completely standalone test script that doesn't use any configuration files
const { chromium } = require('@playwright/test');

(async () => {
  console.log('Starting standalone test');

  try {
    // Get port from environment variable or default to 3000
    const port = process.env.TEST_PORT || process.env.PORT || '3000';
    const appUrl = `http://localhost:${port}`;
    console.log(`Using application URL: ${appUrl}`);

    // Launch a browser manually
    console.log('Launching browser...');
    const browser = await chromium.launch({
      headless: false, // Run headed for visibility
      timeout: 30000, // 30 second timeout
    });

    // Create a new context
    console.log('Creating browser context...');
    const context = await browser.newContext();

    // Create a new page
    console.log('Creating new page...');
    const page = await context.newPage();

    // Navigate to the page
    console.log('Navigating to the app...');
    await page.goto(appUrl, { timeout: 30000 });

    // Log the current URL
    console.log('Current URL:', page.url());

    // Take a screenshot for debugging - save to gitignored screenshots directory
    await page.screenshot({ path: 'tests/e2e/screenshots/standalone-screenshot.png' });
    console.log('Screenshot saved to tests/e2e/screenshots/standalone-screenshot.png');

    // Simple assertions
    console.log('Checking for page content...');
    const body = await page.$('body');
    if (!body) {
      throw new Error('Body element not found');
    }
    console.log('Body element found');

    // Wait for a moment to see the page
    console.log('Waiting for 5 seconds to see the page...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Clean up
    console.log('Cleaning up...');
    await context.close();
    await browser.close();

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})();
