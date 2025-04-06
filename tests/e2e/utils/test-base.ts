import { test as base, expect, Page } from '@playwright/test';
import { ConsoleMessage } from 'playwright-core'; // Import ConsoleMessage type

// Define types for fixture options if needed later
type ErrorCheckFixtures = {
  page: Page; // We are extending the existing page fixture
};

// Define options if needed later
type ErrorCheckOptions = {
  // Example: filterOut?: RegExp;
};

// Extend the base test object
export const test = base.extend<ErrorCheckFixtures & ErrorCheckOptions>({
  // Override the page fixture
  page: async ({ page }, use) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Listener for console messages
    const consoleListener = (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        // Optional: Add filtering logic here if needed in the future
        // e.g., if (options.filterOut && options.filterOut.test(msg.text())) return;

        const errorText = `[Browser Console Error]: ${msg.text()}`;
        console.error(errorText); // Log to test output immediately
        consoleErrors.push(errorText);

        // Include location if available
        const location = msg.location();
        if (location) {
          const locationText = `    at ${location.url}:${location.lineNumber}:${location.columnNumber}`;
          console.error(locationText);
          consoleErrors.push(locationText);
        }
      }
    };

    // Listener for uncaught exceptions
    const pageErrorListener = (exception: Error) => {
      const errorText = `[Uncaught Page Error]: ${exception.message}\n${exception.stack || ''}`;
      console.error(errorText); // Log to test output immediately
      pageErrors.push(errorText);
    };

    page.on('console', consoleListener);
    page.on('pageerror', pageErrorListener);

    // Run the actual test logic using the modified page
    await use(page);

    // After the test runs, check if any errors were collected
    // Combine both console and page errors for the final assertion
    const allErrors = [...consoleErrors, ...pageErrors];

    // Remove listeners after use to prevent leaks
    page.removeListener('console', consoleListener);
    page.removeListener('pageerror', pageErrorListener);

    // Assert that no errors were found
    expect(
      allErrors,
      `Test failed due to browser console or page errors:\n${allErrors.join('\n')}`
    ).toEqual([]);
  },
});

// Re-export expect for convenience
export { expect };
export type { Page, ConsoleMessage }; // Export necessary types
