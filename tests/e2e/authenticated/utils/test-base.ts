import { test as base, expect, Page } from '@playwright/test';
import { ConsoleMessage } from 'playwright-core'; // Import ConsoleMessage type

// Determine session cookie name (adjust if different)
// const sessionCookieName = process.env.NEXTAUTH_SESSION_COOKIE_NAME || 'next-auth.session-token';
// Determine if using secure prefix (adjust based on environment)
// const useSecurePrefix = process.env.NODE_ENV === 'production';
// const secureSessionCookieName = useSecurePrefix
//   ? `__Secure-${sessionCookieName}`
//   : sessionCookieName;

// Get base URL from environment or fallback
// const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';

// Define types for fixture options if needed later
type ErrorCheckFixtures = {
  page: Page; // We are extending the existing page fixture
};

// Define options if needed later
type ErrorCheckOptions = {
  // Example: filterOut?: RegExp;
};

// Helper function to check if an error should be ignored
function shouldIgnoreError(errorText: string): boolean {
  // Ignore React hydration mismatches which are common with dynamic components
  if (
    errorText.includes(
      "A tree hydrated but some attributes of the server rendered HTML didn't match"
    )
  ) {
    return true;
  }

  // Ignore failures from the client logger trying to send logs via fetch
  if (errorText.includes('Client Logger: Failed to send log entry via fetch')) {
    return true;
  }

  // Add other error patterns to ignore here if needed

  return false;
}

// Extend the base test object
export const test = base.extend<ErrorCheckFixtures & ErrorCheckOptions>({
  // Override the page fixture
  page: async ({ page }, use) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Listener for console messages
    const consoleListener = (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        const errorText = msg.text();

        // Skip errors we've decided to ignore
        if (shouldIgnoreError(errorText)) {
          console.log('[Ignored Browser Error]:', errorText.substring(0, 150) + '...');
          return;
        }

        const formattedError = `[Browser Console Error]: ${errorText}`;
        console.error(formattedError); // Log to test output immediately
        consoleErrors.push(formattedError);

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
