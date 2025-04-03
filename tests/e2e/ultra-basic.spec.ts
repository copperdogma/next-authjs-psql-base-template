import { test, expect } from '@playwright/test';

test('ultra basic - page loads', async ({ page }) => {
  console.log('Starting ultra basic test');

  // Navigate to homepage with minimal options
  console.log('Navigating to homepage');
  await page.goto('/');
  console.log('Navigation complete');

  // Basic check that body exists
  await expect(page.locator('body')).toBeVisible();
  console.log('Body is visible');
});
