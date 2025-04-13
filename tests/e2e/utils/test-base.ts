import { test as base, expect, Page } from '@playwright/test';
import { ConsoleMessage } from 'playwright-core'; // Import ConsoleMessage type
import { generateTestSessionToken } from './auth'; // Import the token generator

// Determine session cookie name (adjust if different)
const sessionCookieName = process.env.NEXTAUTH_SESSION_COOKIE_NAME || 'next-auth.session-token';
// Determine if using secure prefix (adjust based on environment)
const useSecurePrefix = process.env.NODE_ENV === 'production';
const secureSessionCookieName = useSecurePrefix
  ? `__Secure-${sessionCookieName}`
  : sessionCookieName;

// Get base URL from environment or fallback
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';

/**
 * Logs in a test user by generating a JWT and setting the session cookie.
 *
 * @param page The Playwright Page object.
 * @param userId Optional user ID for the session. Defaults to the test user ID.
 */
export async function loginTestUser(page: Page, userId?: string): Promise<void> {
  try {
    const token = await generateTestSessionToken(userId);
    console.log(`[Test Setup] Generated test token for user: ${userId || 'default'}`);

    // Parse the baseURL to get domain and protocol reliably
    let url;
    try {
      url = new URL(baseURL);
    } catch (e) {
      console.error(`[Test Setup] Invalid baseURL provided: ${baseURL}`);
      throw new Error(`Invalid baseURL for setting cookie: ${baseURL}`);
    }
    const domain = url.hostname; // e.g., 'localhost'
    const path = '/';
    const isSecure = url.protocol === 'https:';

    console.log(
      `[Test Setup] Setting cookie for domain: ${domain}, path: ${path}, secure: ${isSecure}`
    );

    await page.context().addCookies([
      {
        name: secureSessionCookieName,
        value: token,
        domain: domain, // Use domain from baseURL
        path: path, // Root path
        httpOnly: true,
        secure: isSecure, // Set secure based on baseURL protocol
        sameSite: 'Lax', // Common setting for session cookies
      },
    ]);

    console.log(
      `[Test Setup] Set session cookie (${secureSessionCookieName}) for domain ${domain}`
    );
  } catch (error) {
    console.error('[Test Setup] Failed to log in test user:', error);
    throw error; // Re-throw to fail the test setup
  }
}

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
