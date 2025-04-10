import { test, expect } from '@playwright/test';
import { FirebaseAuthUtils, TEST_USER } from '@/tests/e2e/fixtures/auth-fixtures';

test.describe('Profile Name Editing', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate using the FirebaseAuthUtils class
    await FirebaseAuthUtils.mockSignedInUser(page);
    await page.goto('/profile');
  });

  test.skip('should allow editing user name', async ({ page }) => {
    // SKIPPED: Test is skipped due to ongoing Playwright authentication issues.
    // This test will be re-enabled once Firebase auth mocking is working reliably.
    // Current issue: Unable to navigate to profile page with proper authentication state.

    // Verify initial profile state
    await expect(page).toHaveTitle(/Your Profile/);

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

  test.skip('should validate name during editing', async ({ page }) => {
    // SKIPPED: Test is skipped due to ongoing Playwright authentication issues.
    // This test will be re-enabled once Firebase auth mocking is working reliably.
    // Current issue: Unable to locate and click the Edit button due to auth state problems.

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

  test.skip('should cancel editing without saving changes', async ({ page }) => {
    // SKIPPED: Test is skipped due to ongoing Playwright authentication issues.
    // This test will be re-enabled once Firebase auth mocking is working reliably.
    // Current issue: Unable to find user name text due to authentication state problems.

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
