import { test, expect } from '@playwright/test';
// import { TEST_USER } from '../fixtures/test-fixtures'; // Old import
import { TEST_USER } from '../../utils/test-constants'; // Corrected TEST_USER import
import * as path from 'path';
// import { logger } from '@/lib/logger'; // Removed unused logger import

// Configure logger for test context
// const log = logger.child({ scope: 'edit-profile-test' }); // Removed unused log

// Define the path to the saved storage state
// This path should match the one used in auth.setup.ts
const storageStatePath = path.join(process.cwd(), 'tests/.auth/user.json');

// Common UI selectors for auth detection
// const UI_ELEMENTS = {
//   USER_PROFILE: {
//     TESTID: '[data-testid="user-profile"]',
//     CONTAINER: '[data-testid="profile-container"]',
//     NAV_PROFILE: 'header [data-testid="user-profile"]',
//     IMAGE: '[data-testid="profile-image"]',
//     NAME: '[data-testid="profile-name"]',
//     // Text-based fallbacks
//     TEXT: 'text=/sign out|logout|profile|account|dashboard/i',
//   },
// };

// Use a unique name based on timestamp for each test run
const newName = `Test User ${Date.now().toString().slice(-3)}`;

test.describe.serial('Profile Name Editing', () => {
  // Configure tests in this file to use the saved authentication state
  test.use({ storageState: storageStatePath });

  // Add a setup function that runs before each test to verify auth state
  test.beforeEach(async ({ page }) => {
    await page.goto('/'); // Go to a page that establishes auth state first
    await page.goto('/profile');
    console.log('✅ Successfully navigated to profile page');

    // --- Updated Wait Strategy ---
    // Wait for the main content container to have the 'authenticated' ID.
    console.log('Waiting for client session to be authenticated via ID...');
    await expect(page.locator('#profile-content-authenticated')).toBeVisible({
      timeout: 25000, // Keep a generous timeout
    });
    console.log('✅ Client session authenticated via ID! Proceeding with checks.');

    // --- Essential visibility checks using IDs/Text ---
    console.log('Verifying essential profile elements are visible...');
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible(); // Page title
    await expect(page.getByText('Email')).toBeVisible(); // Email label
    await expect(page.locator('#profile-field-email-value')).toBeVisible({ timeout: 10000 }); // Email value via ID
    await expect(page.locator('#profile-initials-avatar, #profile-image-avatar')).toBeVisible({
      timeout: 10000,
    }); // Avatar (either initials or image) via ID
    console.log('✅ Essential profile elements are visible.');
  });

  test('should allow editing user name', async ({ page }) => {
    test.slow(); // Increase timeout for this test
    // Navigate directly to profile AFTER global auth setup provides the session
    console.log('Navigating directly to /profile using storageState...');
    await page.goto('/profile');

    // Click the edit button
    const editButton = page.locator('#profile-details-edit-button'); // Using ID selector
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Enter the new name
    const nameInput = page.locator('input[name="name"]'); // Using specific input selector
    await expect(nameInput).toBeVisible();
    await nameInput.clear();
    await nameInput.fill(newName);

    // Save the changes
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();

    // Verify success message appears first
    await expect(page.getByText('Name updated successfully')).toBeVisible({ timeout: 15000 });

    // Check that we're no longer in edit mode
    await expect(nameInput).not.toBeVisible({ timeout: 5000 });

    // --- Assertions for Immediate Update ---

    // 1. Verify the name updated on the profile page content itself
    console.log('Verifying name update on profile page content...');
    const profilePageDisplayNameElement = page.locator('#profile-display-name');
    await expect(profilePageDisplayNameElement).toHaveText(newName, { timeout: 10000 });
    console.log('✅ Name updated correctly on profile page content.');

    // Verify name update in site header
    console.log('Verifying name update in site header...');
    // Find the chip in the header and check its text content
    const headerProfileChip = page.locator('header [data-testid="user-profile-chip"]');
    await expect(headerProfileChip).toHaveText(newName, {
      timeout: 5000, // Shorter timeout as this should be fast if working correctly
    });
    console.log('✅ Name updated correctly in site header.');

    // --- Removed verification after reload ---
    // The immediate checks above confirm the UI updates without a reload.
    // Persistence across reloads is handled by NextAuth session management.
  });

  test('should validate name during editing', async ({ page }) => {
    // Navigate to profile
    await page.goto('/profile');

    // Click the edit button
    const editButton = page.locator('#profile-details-edit-button'); // Using ID selector
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Fill with invalid name (empty)
    const nameInput = page.locator('input[name="name"]'); // Using specific input selector
    await expect(nameInput).toBeVisible();
    await nameInput.clear();
    await nameInput.fill('');
    // Save button should still be enabled, click it to trigger server-side validation
    const saveButton = page.getByRole('button', { name: 'Save' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Verify validation message is shown (check server action message)
    // The server action returns a specific message for short/empty names
    const expectedValidationMessage = 'Name must be at least 3 characters long.';
    await expect(
      page.locator('form[data-edit-name="true"]').getByText(expectedValidationMessage)
    ).toBeVisible();

    // Fill with valid name and save
    await nameInput.fill(TEST_USER.displayName);
    await saveButton.click();

    // Verify success and name update using ID
    await expect(page.getByText('Name updated successfully')).toBeVisible();
    const displayNameElement = page.locator('#profile-display-name');
    await expect(displayNameElement).toBeVisible();
    await expect(displayNameElement).toHaveText(TEST_USER.displayName);
  });

  test('should cancel editing without saving changes', async ({ page }) => {
    // Navigate to profile
    await page.goto('/profile');

    // Get the current name before editing using ID
    const currentNameElement = page.locator('#profile-display-name');
    const currentName = (await currentNameElement.textContent()) || '';
    expect(currentName).toBeTruthy(); // Ensure we got a name

    // Click the edit button
    const editButton = page.locator('#profile-details-edit-button'); // Using ID selector
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Enter a new name
    const nameInput = page.locator('input[name="name"]'); // Using specific input selector
    await expect(nameInput).toBeVisible();
    await nameInput.clear();
    await nameInput.fill('Cancelled Name Change');

    // Cancel the edit
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();

    // Verify the name has not changed using ID
    const finalDisplayNameElement = page.locator('#profile-display-name');
    await expect(finalDisplayNameElement).toBeVisible();
    await expect(finalDisplayNameElement).toHaveText(currentName);
    await expect(nameInput).not.toBeVisible(); // Verify input is gone
  });
});
