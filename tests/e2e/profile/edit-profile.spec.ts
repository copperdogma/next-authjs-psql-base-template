import { test, expect } from '@playwright/test';
import { TEST_USER } from '@/tests/e2e/fixtures/auth-fixtures';
import * as path from 'path';
// Re-add fs import if needed later, but not for this version
// import * as fs from 'fs';

// Define the path to the saved storage state
const storageStatePath = path.join(process.cwd(), 'tests/.auth/user.json');

// Re-enable test.use({ storageState: ... })
test.describe('Profile Name Editing', () => {
  // Configure tests in this file to use the saved authentication state
  test.use({ storageState: storageStatePath });

  test('should allow editing user name', async ({ page, context }) => {
    // Reverted to using storageState. Removed UI Login & Explicit Cookie Setting.

    // Navigate directly to profile AFTER global auth setup provides the session
    console.log('Navigating directly to /profile using storageState...');
    await page.goto('/profile');
    // Wait for the main content container within the Paper to be present
    // This selector might need adjustment based on actual rendered DOM
    console.log('Waiting for profile page main container...');
    const profileContainer = page.locator('main >> div[class*="MuiPaper-root"] >> div[class*="MuiBox-root"]:has(> section)');
    await expect(profileContainer).toBeVisible({ timeout: 20000 }); // Increased timeout slightly
    console.log('✅ Profile container found. Now verifying email...');

    // Now verify the email, which should be rendered by ProfileContent
    await expect(page.getByText(TEST_USER.email)).toBeVisible({ timeout: 10000 });
    console.log('✅ User email found.');

    // Click the edit button
    const editButton = page.getByRole('button', { name: 'Edit' });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Verify edit form appears
    const nameInput = page.getByRole('textbox');
    await expect(nameInput).toBeVisible();

    // Clear the existing name and type a new one
    await nameInput.clear();
    const newName = `Test User ${Date.now()}`;
    await nameInput.fill(newName);

    // Submit the form
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();

    // Verify success message appears and edit form disappears
    await expect(page.getByText('Name updated successfully')).toBeVisible();
    await expect(nameInput).not.toBeVisible();

    // Verify the displayed name has changed
    await expect(page.getByRole('heading', { level: 6, name: newName })).toBeVisible();

    // Reload the page and verify persistence
    await page.reload();
    await expect(page.getByRole('heading', { level: 6, name: newName })).toBeVisible();
  });

  test('should validate name during editing', async ({ page }) => {
    // SKIPPED: Test consistently fails due to inability to reliably load
    // the authenticated /profile route using stored auth state during direct navigation.

    // Navigate to profile AFTER global auth setup
    await page.goto('/profile');

    // Wait for a key authenticated element
    await expect(page.getByText(TEST_USER.email)).toBeVisible({ timeout: 15000 });

    // Click the edit button
    const editButton = page.getByRole('button', { name: 'Edit' });
    await editButton.click();

    // Try submitting an empty name
    const nameInput = page.getByRole('textbox');
    await nameInput.clear();

    // Submit the form with empty name
    const saveButton = page.getByRole('button', { name: 'Save' });
    await saveButton.click();

    // Verify error message appears
    await expect(page.getByText('Name is required')).toBeVisible();

    // Fill in a valid name and verify it works
    await nameInput.fill(TEST_USER.displayName);
    await saveButton.click();

    // Verify success message and updated name
    await expect(page.getByText('Name updated successfully')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 6, name: TEST_USER.displayName })
    ).toBeVisible();
  });

  test('should cancel editing without saving changes', async ({ page }) => {
    // SKIPPED: Test consistently fails due to inability to reliably load
    // the authenticated /profile route using stored auth state during direct navigation.

    // Navigate to profile AFTER global auth setup
    await page.goto('/profile');

    // Wait for a key authenticated element
    await expect(page.getByText(TEST_USER.email)).toBeVisible({ timeout: 15000 });

    // Get the current name before editing
    const currentNameEl = page.getByText(TEST_USER.displayName);
    const currentName = await currentNameEl.textContent();

    // Click edit button
    const editButton = page.getByRole('button', { name: 'Edit' });
    await editButton.click();

    // Change the name in the form
    const nameInput = page.getByRole('textbox');
    await nameInput.clear();
    await nameInput.fill('Name That Should Not Be Saved');

    // Click the cancel button
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();

    // Verify edit form disappears
    await expect(nameInput).not.toBeVisible();

    // Verify name is unchanged
    await expect(
      page.getByRole('heading', { level: 6, name: currentName as string })
    ).toBeVisible();
  });
});
