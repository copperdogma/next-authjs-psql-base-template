import { test, expect, Page } from '../utils/test-base';
import { ROUTES } from '../../../lib/constants/routes';
import { faker } from '@faker-js/faker';

// Base URL is set in playwright.config.ts

async function navigateToRegisterAndVerifyForm(page: Page): Promise<void> {
  await page.goto(ROUTES.REGISTER, { waitUntil: 'networkidle' });
  await expect(page.locator('h1:has-text("Register")')).toBeVisible();
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('#confirmPassword')).toBeVisible();
  await expect(page.locator('button[type="submit"]:has-text("Register")')).toBeVisible();
}

async function fillAndSubmitRegistrationForm(
  page: Page,
  userData: { email: string; password: string }
): Promise<void> {
  await page.locator('#email').fill(userData.email);
  await page.locator('#password').fill(userData.password);
  await page.locator('#confirmPassword').fill(userData.password); // Assume password confirmation
  await page.locator('button[type="submit"]:has-text("Register")').click();
}

test.describe('User Registration', () => {
  test('should allow a new user to register successfully', async ({ page }) => {
    await navigateToRegisterAndVerifyForm(page);

    const newUser = {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 10, prefix: 'Test1!' }), // Ensure complexity
    };

    await fillAndSubmitRegistrationForm(page, newUser);

    // --- Assertion --- Check for successful registration
    // Option 1: Check for redirection to dashboard (preferred if auto-login happens)
    await expect(page).toHaveURL(ROUTES.DASHBOARD, { timeout: 20000 });
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Option 2: Check for redirection to login page with a success message (if no auto-login)
    // await expect(page).toHaveURL(ROUTES.LOGIN, { timeout: 15000 });
    // await expect(page.locator('.alert-success, [data-testid="registration-success"]')).toBeVisible(); // Adjust selector

    // Option 3: Check for a general success indicator on the registration page itself (less ideal)
    // await expect(page.locator('.alert-success, [data-testid="registration-success"]')).toBeVisible(); // Adjust selector

    // --- Verification (Optional but recommended): Try logging in with the new credentials ---
    // This requires logging out first if auto-login happened.
    // await page.locator('[data-testid="sign-out-button"]').click(); // Adjust selector if needed
    // await page.waitForURL(ROUTES.LOGIN);
    // await page.locator('#email').fill(newUser.email);
    // await page.locator('#password').fill(newUser.password);
    // await page.locator('button:has-text("Sign In with Email")').click();
    // await expect(page).toHaveURL(ROUTES.DASHBOARD, { timeout: 15000 });
    // await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should show an error if email is already taken', async ({ page }) => {
    // Use the standard test user known to exist
    const existingUser = {
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'Test123!',
    };

    await navigateToRegisterAndVerifyForm(page);
    await fillAndSubmitRegistrationForm(page, existingUser);

    // Check for the specific error message
    await expect(page.locator('[role="alert"]')).toContainText(
      'already registered',
      { timeout: 10000 } // Increase timeout slightly
    );
    // Ensure still on registration page
    await expect(page).toHaveURL(new RegExp(ROUTES.REGISTER));
  });
});
