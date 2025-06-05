import { Page } from '@playwright/test';
import path from 'path';

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
