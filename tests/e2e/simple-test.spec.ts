import { test, expect } from './utils/test-base';

/**
 * Simple diagnosis test
 * This test is intentionally minimal to help diagnose server startup issues
 */
test('basic navigation test', async ({ page }) => {
  console.log('Attempting to navigate to homepage...');

  // Navigate to the homepage
  await page.goto('/');

  // Take a screenshot for debugging
  await page.screenshot({ path: 'tests/e2e/screenshots/home-page.png' });

  // Log useful information
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());

  // Basic assertion to make sure the page loaded
  expect(await page.title()).toBeDefined();

  // Check if any heading is visible
  const hasHeading = (await page.locator('h1, h2, h3, h4, h5, h6').count()) > 0;
  if (hasHeading) {
    console.log(
      'Found heading:',
      await page.locator('h1, h2, h3, h4, h5, h6').first().textContent()
    );
  } else {
    console.log('No heading found on the page');
  }

  // Check for any specific elements that should be on the homepage
  const bodyText = await page.locator('body').textContent();
  console.log('Body content length:', bodyText?.length);

  // Just verify that the body is visible
  await expect(page.locator('body')).toBeVisible();
});
