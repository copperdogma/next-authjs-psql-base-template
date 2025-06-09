import { test, expect } from '@playwright/test';
import { UI_ELEMENTS } from './auth-selectors';

test.describe('Authentication', () => {
  test('should display an error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill(UI_ELEMENTS.AUTH.EMAIL_INPUT, 'invalid@example.com');
    await page.fill(UI_ELEMENTS.AUTH.PASSWORD_INPUT, 'invalidpassword');

    // Click the sign-in button
    await page.click(UI_ELEMENTS.AUTH.CREDENTIALS_SUBMIT);

    // Check for the error message using its specific data-testid FIRST
    const errorMessage = page.locator('[data-testid="login-error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    // Now, wait for the loading state to complete by checking the button text and enabled state
    const signInButton = page.locator(UI_ELEMENTS.AUTH.CREDENTIALS_SUBMIT);
    await expect(signInButton).toHaveText('Sign In with Email', { timeout: 5000 });
    await expect(signInButton).toBeEnabled({ timeout: 5000 });

    // Finally, check the content of the error message
    await expect(errorMessage).toContainText('Invalid email or password.');
  });
});
