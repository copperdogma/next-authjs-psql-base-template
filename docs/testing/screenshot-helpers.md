# Screenshot Helpers Guide

## Overview

This document provides guidance on using screenshot helpers in our testing suite. Screenshots are an essential tool for debugging, documentation, and visual regression testing.

## Screenshot Helpers

Our project includes several helper functions for taking and managing screenshots during tests:

### `takeMobileScreenshot`

For capturing screenshots in mobile viewport tests:

```typescript
import { takeMobileScreenshot } from '../utils/mobile-screenshot-helpers';

// Basic usage
await takeMobileScreenshot(page, 'home-page.png');

// With options
await takeMobileScreenshot(page, 'full-page-screenshot.png', { fullPage: true });
```

This helper:

- Ensures consistent naming with `mobile-` prefix
- Saves screenshots to the correct directory
- Logs the screenshot path for easier debugging

### `takeMobileErrorScreenshot`

For capturing error states in mobile tests:

```typescript
import { takeMobileErrorScreenshot } from '../utils/mobile-screenshot-helpers';

try {
  // Test code
} catch (error) {
  await takeMobileErrorScreenshot(page, 'login-failure');
  throw error;
}
```

This helper:

- Adds a timestamp to the filename
- Uses the mobile screenshot directory
- Creates a consistently named error screenshot

## Screenshot Conventions

### Naming Conventions

To maintain consistency across our test suite, follow these naming conventions:

- **Mobile Screenshots**: `mobile-{feature}-{state}.png`

  - Example: `mobile-login-form.png`, `mobile-dashboard-loaded.png`

- **Error Screenshots**: `{feature}-error-{timestamp}.png`

  - Example: `login-error-1623456789123.png`

- **Test Step Screenshots**: `{feature}-step-{number}.png`
  - Example: `checkout-step-1.png`, `checkout-step-2.png`

### Directory Structure

Screenshots are saved to specific directories:

- **Mobile Screenshots**: `tests/e2e/screenshots/`
- **Regular Screenshots**: `tests/e2e/screenshots/`
- **Error Screenshots**: `tests/e2e/screenshots/`

## Usage Patterns

### Taking Screenshots at Key Points

Take screenshots at key points in your test to document the state:

```typescript
test('user login flow', async ({ page }) => {
  // Initial state
  await page.goto('/login');
  await takeMobileScreenshot(page, 'login-initial.png');

  // After filling form
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await takeMobileScreenshot(page, 'login-filled.png');

  // After submission
  await page.click('[data-testid="submit-button"]');
  await page.waitForURL('/dashboard');
  await takeMobileScreenshot(page, 'login-success.png');
});
```

### Error Screenshots in Try/Catch Blocks

Always capture error states:

```typescript
test('complex user interaction', async ({ page }) => {
  try {
    // Test steps
    await page.goto('/complex-form');
    await takeMobileScreenshot(page, 'complex-form-initial.png');

    // More test steps
    // ...
  } catch (error) {
    // Capture error state
    await takeMobileErrorScreenshot(page, 'complex-form-failure');
    throw error; // Re-throw to fail the test
  }
});
```

### Conditional Screenshots

Take screenshots based on conditions:

```typescript
test('feature with multiple paths', async ({ page }) => {
  await page.goto('/feature');

  const isFeatureEnabled = await page.locator('[data-testid="feature-toggle"]').isVisible();

  if (isFeatureEnabled) {
    await takeMobileScreenshot(page, 'feature-enabled.png');
    // Test enabled path
  } else {
    await takeMobileScreenshot(page, 'feature-disabled.png');
    // Test disabled path
  }
});
```

## Visual Regression Testing

While we don't currently have automated visual regression testing, our screenshot helpers lay the groundwork for adding it later:

```typescript
// Future implementation example
test('visual regression test', async ({ page }) => {
  await page.goto('/dashboard');

  // Take screenshot for comparison
  const screenshot = await takeMobileScreenshot(page, 'dashboard.png');

  // Compare with baseline (future implementation)
  expect(screenshot).toMatchBaseline('dashboard-baseline.png', {
    threshold: 0.1, // 10% pixel difference allowed
  });
});
```

## Debugging with Screenshots

When tests fail in CI/CD pipelines, screenshots are invaluable for understanding what went wrong:

1. Check the error message and stack trace
2. Look for screenshots taken just before the failure
3. Check for error screenshots with timestamps close to the failure time
4. Compare with expected state to identify the issue

## Screenshot Cleanup

To prevent your repository from filling up with screenshots:

- **CI/CD**: Configure your CI/CD pipeline to save screenshots as artifacts but not commit them
- **Local Development**: Add screenshot directories to `.gitignore` if they're not needed for documentation
- **Automated Cleanup**: Consider adding a pre-commit hook to clean up screenshots

## Best Practices

1. **Be Deliberate**: Take screenshots at key points in user flows, not for every action
2. **Descriptive Naming**: Use descriptive names that indicate what the screenshot shows
3. **Error States**: Always capture error states with the error screenshot helpers
4. **Full Page When Needed**: Use the `fullPage` option for long pages or when context matters
5. **Mobile and Desktop**: For responsive applications, capture both mobile and desktop states
6. **Test Step Progression**: For complex flows, use numbered steps in filenames

## Troubleshooting

### Issue: Screenshot Not Taken

If a screenshot isn't being saved:

1. Check if the test reached that point (add console logs)
2. Verify the directory exists and is writable
3. Check for errors in the test logs
4. Try using a full absolute path instead of a relative path

### Issue: Element Not Visible in Screenshot

If an element is missing from the screenshot:

1. Add waits before taking the screenshot
2. Use `page.waitForSelector()` to ensure the element is present
3. Consider using `{ fullPage: true }` if the element is below the fold
4. Check if the element is in a different state than expected

### Issue: Poor Quality Screenshots

For better quality screenshots:

1. Set appropriate viewport size before navigating
2. Allow animations to complete before capturing
3. Consider setting a higher device scale factor
4. For important UI elements, take focused screenshots of just that area

## Conclusion

Effective use of screenshot helpers improves test reliability, debugging, and documentation. Follow the conventions and best practices outlined in this guide to get the most value from screenshots in your tests.
