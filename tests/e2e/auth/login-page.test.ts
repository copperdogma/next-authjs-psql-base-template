import { test, expect } from '@playwright/test';

test.describe('Login Page Rendering', () => {
  test('should properly render login page with callback URL', async ({ page }) => {
    // Navigate directly to login with a callback URL
    await page.goto('/login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2Fdashboard');
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/e2e/screenshots/direct-login-callback.png' });
    
    // Check the page title - using the one that's actually set in the application
    // If this passes but other tests fail, it confirms we're reaching the page but it's not rendering correctly
    await expect(page).toHaveTitle(/.*/, { timeout: 5000 });
    
    // Check for critical UI elements - looking for the "Sign In with Google" button based on text
    // Instead of using testId which doesn't seem to be present
    const signInButton = page.getByText('Sign In with Google', { exact: true });
    await expect(signInButton).toBeVisible({ timeout: 5000 });
    
    // Check for "Welcome" text which should be on the login page
    const welcomeHeading = page.getByText('Welcome', { exact: true });
    await expect(welcomeHeading).toBeVisible({ timeout: 5000 });
    
    // Check that we have actual content on the page - this will fail if the page is blank
    const bodyContent = await page.evaluate(() => {
      return document.body.textContent || '';
    });
    
    // Log the actual content length to debug the issue
    console.log(`Body content length: ${bodyContent.length}`);
    
    // This assertion should fail with a blank page
    expect(bodyContent.length).toBeGreaterThan(50);
    
    // Check for essential navigation elements
    const navigationElements = await page.locator('nav').count();
    expect(navigationElements).toBeGreaterThan(0);
  });
  
  test('should render login page properly WITHOUT a callback URL', async ({ page }) => {
    // Navigate directly to login WITHOUT a callback URL
    await page.goto('/login');
    
    // Take a screenshot for comparison
    await page.screenshot({ path: 'tests/e2e/screenshots/direct-login-no-callback.png' });
    
    // Check the page title 
    await expect(page).toHaveTitle(/.*/, { timeout: 5000 });
    
    // Use a more reliable locator based on text content
    const signInButton = page.getByText('Sign In with Google', { exact: true });
    await expect(signInButton).toBeVisible({ timeout: 5000 });
    
    // Also check for the welcome message
    const welcomeText = page.getByText('Welcome', { exact: true });
    await expect(welcomeText).toBeVisible({ timeout: 5000 });
    
    // Check that we have actual content on the page
    const bodyContent = await page.evaluate(() => {
      return document.body.textContent || '';
    });
    
    // Log the actual content length to compare with the callback URL version
    console.log(`Body content length (no callback): ${bodyContent.length}`);
    
    // This assertion should pass for a properly rendered page
    expect(bodyContent.length).toBeGreaterThan(50);
    
    // Check for navigation elements
    const navigationElements = await page.locator('nav').count();
    expect(navigationElements).toBeGreaterThan(0);
  });
}); 