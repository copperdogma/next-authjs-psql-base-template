import { test, expect } from '@playwright/test';

describe('Authentication Redirects', () => {
  test('Attempt to access /dashboard without login should redirect to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
    // Verify that the login page content is displayed
    await expect(page.getByRole('heading', { name: 'Login' })).toBeAttached();
  });

  test('Attempt to access /profile without login should redirect to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/.*login/);
    // Verify that the login page content is displayed
    await expect(page.getByRole('heading', { name: 'Login' })).toBeAttached();
  });
});
