# Mobile Testing Guide

## Overview

This document provides guidance on mobile testing approaches and utilities for the next-auth-psql-app application. Mobile testing is essential for ensuring our application functions correctly across different viewport sizes and device types.

## Mobile Testing Strategy

Our mobile testing strategy includes:

1. **Responsive Testing**: Testing the application at different viewport sizes
2. **Device Emulation**: Emulating specific mobile devices using Playwright's device presets
3. **Touch Interaction Testing**: Testing touch-specific interactions
4. **Performance Testing**: Checking performance metrics specific to mobile devices

## Mobile Testing Setup

### Viewport Configuration

We test on standard mobile viewport sizes:

```typescript
// Small mobile (iPhone SE)
await page.setViewportSize({ width: 375, height: 667 });

// Medium mobile (iPhone 13)
await page.setViewportSize({ width: 390, height: 844 });

// Tablet (iPad)
await page.setViewportSize({ width: 768, height: 1024 });
```

### Device Emulation

For more realistic mobile testing, we use Playwright's device descriptors:

```typescript
import { devices } from '@playwright/test';

// Test on iPhone 13
test.use({ ...devices['iPhone 13'] });

// Test on iPad
test.use({ ...devices['iPad (gen 7)'] });
```

## Mobile Screenshot Helpers

We've created specialized helper functions for taking and managing mobile screenshots:

### `takeMobileScreenshot`

This helper ensures screenshots from mobile tests are saved to the correct directory with consistent naming:

```typescript
/**
 * Helper function to take mobile screenshots and ensure they're saved to the correct directory
 *
 * @param page The Playwright page object
 * @param filename The filename for the screenshot (without path)
 * @param options Additional screenshot options
 * @returns Promise that resolves when the screenshot is taken
 */
export async function takeMobileScreenshot(
  page: Page,
  filename: string,
  options?: { fullPage?: boolean }
): Promise<Buffer> {
  // Ensure the filename starts with 'mobile-' for consistency
  const formattedFilename = filename.startsWith('mobile-') ? filename : `mobile-${filename}`;

  // Always save to the screenshots directory in the e2e tests folder
  const screenshotPath = path.join('tests', 'e2e', 'screenshots', formattedFilename);

  console.log(`Taking mobile screenshot: ${screenshotPath}`);

  return page.screenshot({
    path: screenshotPath,
    fullPage: options?.fullPage ?? false,
  });
}
```

### `takeMobileErrorScreenshot`

This helper takes screenshots when mobile tests fail, automatically adding timestamps:

```typescript
/**
 * Takes a screenshot when a test fails in mobile mode
 *
 * @param page The Playwright page object
 * @param testName Name of the test for the filename
 * @returns Promise that resolves when the screenshot is taken
 */
export async function takeMobileErrorScreenshot(page: Page, testName: string): Promise<Buffer> {
  const timestamp = Date.now();
  return takeMobileScreenshot(page, `mobile-${testName}-error-${timestamp}.png`);
}
```

## Usage Examples

### Basic Mobile Test

```typescript
import { test, expect } from '@playwright/test';
import { takeMobileScreenshot } from '../utils/mobile-screenshot-helpers';

test('mobile responsive layout', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // Navigate to the page
  await page.goto('/');

  // Take a screenshot
  await takeMobileScreenshot(page, 'home-page.png');

  // Verify mobile menu button is visible
  const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
  await expect(mobileMenuButton).toBeVisible();
});
```

### Mobile Test with Error Handling

```typescript
import { test, expect } from '@playwright/test';
import {
  takeMobileScreenshot,
  takeMobileErrorScreenshot,
} from '../utils/mobile-screenshot-helpers';

test('mobile login flow', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  try {
    // Navigate to login page
    await page.goto('/login');
    await takeMobileScreenshot(page, 'login-page.png');

    // Fill credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Take screenshot before submitting
    await takeMobileScreenshot(page, 'pre-login.png');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Wait for navigation and take screenshot
    await page.waitForURL('/dashboard');
    await takeMobileScreenshot(page, 'post-login-dashboard.png');
  } catch (error) {
    // Take error screenshot
    await takeMobileErrorScreenshot(page, 'login-failure');
    throw error;
  }
});
```

## Mobile Test Fixtures

We provide specialized test fixtures to make mobile testing easier:

```typescript
// Define mobile test fixture
const test = baseTest.extend({
  mobilePage: async ({ browser }, use) => {
    // Set up mobile viewport
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }, // iPhone SE dimensions
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

// Use the fixture in tests
test('mobile login with fixture', async ({ mobilePage }) => {
  await mobilePage.goto('/login');
  // Test continues with pre-configured mobile page
});
```

## Mobile-Specific Challenges and Solutions

### Challenge: Touch Events

Mobile devices use touch events rather than mouse events. Playwright handles this automatically in most cases, but some interactions might need special handling.

**Solution**: Use specific touch actions when needed:

```typescript
await page.touchscreen.tap(100, 200);
```

### Challenge: Responsive Elements

Some elements might be hidden or displayed differently on mobile viewports.

**Solution**: Check for mobile-specific selectors and conditional visibility:

```typescript
// Check if mobile menu button appears (only on mobile)
const mobileMenuButton = await page.locator('[data-testid="mobile-menu-button"]').isVisible();

if (mobileMenuButton) {
  // Mobile-specific flow
  await page.click('[data-testid="mobile-menu-button"]');
  await page.click('[data-testid="mobile-nav-home"]');
} else {
  // Desktop flow
  await page.click('[data-testid="desktop-nav-home"]');
}
```

### Challenge: Different Behavior

Mobile versions might have different behavior or functionality.

**Solution**: Use viewport detection to adjust test expectations:

```typescript
const viewportSize = page.viewportSize();
if (viewportSize && viewportSize.width < 768) {
  // Mobile expectations
  await expect(page.locator('.mobile-only-element')).toBeVisible();
} else {
  // Desktop expectations
  await expect(page.locator('.desktop-only-element')).toBeVisible();
}
```

## Best Practices

1. **Always Use Helper Functions**: Use `takeMobileScreenshot` and `takeMobileErrorScreenshot` instead of direct `page.screenshot()` calls for consistency.

2. **Test Common Breakpoints**: Test at common mobile breakpoints (375px, 390px, 768px).

3. **Conditional Testing**: Add conditions based on viewport size for tests that should behave differently on mobile.

4. **Error Screenshots**: Always include error screenshots for failed mobile tests for easier debugging.

5. **Test Real User Flows**: Focus on testing real mobile user flows rather than every UI element.

6. **Descriptive Filenames**: Use descriptive filenames for screenshots that indicate the test and state.

## Screenshot Management

Mobile screenshots are saved to the `tests/e2e/screenshots/` directory with the following naming conventions:

- Regular screenshots: `mobile-{descriptive-name}.png`
- Error screenshots: `mobile-{test-name}-error-{timestamp}.png`

Screenshots are kept in version control for comparison and documentation purposes, but they are also regenerated during test runs.

## Running Mobile Tests

You can run mobile-specific tests using the following command:

```bash
npm run test:e2e -- --project=mobile
```

Or run all tests including mobile with:

```bash
npm run test:e2e
```
