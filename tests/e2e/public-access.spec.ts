import { test, expect } from '@playwright/test';

test.describe('Public Route Accessibility', () => {
  // Test pages that should ALWAYS be public
  const publicPages = ['/', '/about'];
  for (const pagePath of publicPages) {
    test(`Page ${pagePath} should be accessible without login`, async ({ page }) => {
      const response = await page.goto(pagePath);
      // Check if the page loaded successfully (status 2xx)
      expect(response?.ok()).toBeTruthy();
      // Verify we weren't redirected to the login page
      expect(page.url()).not.toContain('/login');
      // A simple check for main content existence
      await expect(page.locator('main')).toBeVisible();
    });
  }

  // Test pages that should ALWAYS be protected
  const protectedPages = ['/dashboard', '/profile'];
  for (const pagePath of protectedPages) {
    test(`Page ${pagePath} should redirect to /login without login`, async ({ page }) => {
      await page.goto(pagePath);
      // Wait for potential redirection
      await page.waitForURL(/.*login/);
      // Verify we are on the login page (or a URL containing login)
      expect(page.url()).toContain('/login');
      // Verify the redirection includes the callbackUrl
      expect(page.url()).toContain(`callbackUrl=${encodeURIComponent(pagePath)}`);
    });
  }

  // Test API routes that should be public
  const publicApiRoutes = ['/api/health'];
  for (const apiPath of publicApiRoutes) {
    test(`API Route ${apiPath} should be accessible without login`, async ({ request }) => {
      const response = await request.get(apiPath);
      expect(response.ok()).toBeTruthy();
      // We might not always get JSON, so just check status
    });
  }

  // Note: We don't explicitly test protected API routes here without auth,
  // as they might return 401/403 directly instead of redirecting,
  // which is harder to universally assert without knowing API specifics.
  // Authentication flow tests cover accessing protected APIs *with* login.
});
