# End-to-End Testing Guide

This document provides instructions for running and writing end-to-end (E2E) tests for the Next.js application using Playwright with NextAuth.js.

## Overview

Our E2E testing follows industry best practices for testing Next.js applications with NextAuth.js. The setup uses Playwright's built-in capabilities to:

- **Manage Servers**: Automatically start and manage the Next.js development server
- **Handle Authentication**: Set up and reuse authentication state
- **Use Test Database**: Test against a dedicated test database for consistent, isolated testing
- **Provide Diagnostics**: Comprehensive debugging with trace files, screenshots, and logs

## Running Tests

### Prerequisites

1. **Environment Setup**:
   - Create a `.env.test` file based on `.env.example`
   - Ensure all dependencies are installed: `npm install`

### Recommended Commands

```bash
# Most reliable way to run E2E tests
npm run test:e2e

# Run a specific test with the runner
npm run test:e2e tests/e2e/basic-navigation.spec.ts

# Run tests with debugging enabled
npm run test:e2e:debug

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Tests with authentication
npm run test:e2e:auth-only

# Auth tests with debugging enabled
npm run test:e2e:auth:debug

# Auth tests in headed mode
npm run test:e2e:auth:headed

# Run tests against an existing server (don't start a new one)
npm run test:e2e:against-existing

# Run tests against a custom URL
npm run test:e2e:custom-url
# or specify a custom URL directly with the original runner
cross-env PLAYWRIGHT_TEST_BASE_URL=http://localhost:8000 playwright test

# Run only UI tests (no authentication required)
npm run test:e2e:ui-only

# View the HTML test report
npm run test:e2e:report
```

## Configuration

The testing framework is configured in several key files:

1. **playwright.config.ts**:

   - Configures Playwright with test projects, browser settings, and server management
   - Defines the storage state path for authentication

2. **.env.test**:

   - Contains environment variables for testing
   - Defines test user credentials and database settings

3. **tests/e2e/auth.setup.ts**:

   - Sets up authentication for tests requiring auth
   - Saves authenticated state to `tests/.auth/user.json`

4. **scripts/run-e2e-with-checks.js**:
   - Orchestrates the test execution process
   - Manages server startup/shutdown
   - Scans server logs for errors after tests complete
   - Handles port conflicts automatically

## Reliable Testing Approach

We provide a robust testing approach to avoid common issues:

1. **Automatic Port Management**:

   - Detects and kills processes using required ports
   - Prevents port conflict errors that cause test failures

2. **Server Orchestration**:

   - Starts the Next.js server with proper environment variables
   - Waits for server to be fully ready before running tests
   - Properly cleans up server processes after tests complete

3. **Health Checks**:

   - Performs HTTP health checks to ensure the server is responding
   - Provides detailed error messages when server connectivity issues occur
   - Retries failed health checks with exponential backoff
   - Falls back to curl if fetch is unavailable

4. **Flexible Server Options**:

   - Can test against an existing server with `--use-existing-server` flag
   - Supports testing against custom URLs with `--base-url` parameter
   - Verifies server connectivity before running tests, even with existing servers

5. **Enhanced Parameter Handling**:

   - The `run-e2e-with-checks.js` script accepts Playwright parameters
   - Supports direct passing of arguments like `--debug`, `--headed`, and `--project=chromium`
   - Can also accept specific test file paths for targeted testing
   - Uses format: `npm run test:e2e -- --debug tests/e2e/my-test.spec.ts`

6. **Log Analysis**:

   - Scans server logs for errors after tests complete
   - Distinguishes between test failures and server errors
   - Properly reports both types of issues for better debugging

7. **Standardized Configuration**:

   - All settings are centralized in `.env.test`
   - Tests use consistent timeouts and navigation settings

8. **Improved Error Handling**:
   - Detailed logs of server activity and test execution
   - Human and AI-readable error messages with troubleshooting steps
   - Screenshots captured on test failures
   - Traces recorded for debugging complex issues

## Test Organization

Tests are located in the `tests/e2e` directory and organized by functionality:

```
tests/e2e/
├── auth.setup.ts                # Authentication setup
├── auth-basic.spec.ts           # Basic authentication tests
├── basic-navigation.spec.ts     # Basic navigation tests
├── ultra-basic.spec.ts          # Ultra basic tests
├── ui/                          # UI tests (no auth required)
│   ├── navigation.spec.ts
│   └── accessibility.spec.ts
├── auth/                        # Authentication flow tests
│   └── login.spec.ts
└── features/                    # Feature tests (with auth)
    ├── dashboard.spec.ts
    └── profile.spec.ts
```

## Writing Tests

### Test Projects

The configuration defines several test projects to handle different scenarios:

1. **setup**: Runs authentication setup
2. **ui-tests**: Tests that don't require authentication
3. **chromium**: Authenticated tests running in Chromium

### Authentication Testing Approaches

Our system supports multiple authentication testing approaches:

1. **Basic Tests (No Auth)**:

   - Use `npm run test:e2e`
   - Good for testing UI components, navigation, and public pages

2. **NextAuth.js Tests**:

   - Use `npm run test:e2e:auth-only`
   - Tests authentication with NextAuth.js and PostgreSQL
   - Sets up a test user with credentials from `.env.test`
   - Allows testing real login flows and protected routes
   - Great for testing authentication-dependent features

3. **Pre-authenticated Tests**:
   - Use auth.setup.ts to pre-authenticate and store credentials
   - Tests can reuse this authenticated state
   - Faster than login for each test, but less thorough

### Example Tests

**UI Test (No Auth Required)**:

```typescript
import { test, expect } from '@playwright/test';

test('can navigate to about page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL('/about');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('About');
});
```

**Authentication Test**:

```typescript
import { test, expect } from '@playwright/test';

test('can log in with valid credentials', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill the login form with test user credentials (from .env.test)
  await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'Test123!');

  // Click login and wait for navigation
  await Promise.all([
    page.waitForNavigation(),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  // Verify we're logged in
  await expect(page.getByText('Welcome back')).toBeVisible();
});
```

**Authenticated Test**:

```typescript
import { test, expect } from '@playwright/test';

test('authenticated user can access dashboard', async ({ page }) => {
  // Authentication already handled via storageState
  await page.goto('/dashboard');

  // Test dashboard functionality
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dashboard');
  await expect(page.getByText('Welcome back')).toBeVisible();
});
```

## Debugging

When tests fail, you have several debugging options:

1. **HTML Report**: Run `npm run test:e2e:report` to see detailed test results
2. **Screenshots**: Look in `tests/e2e/screenshots/` for automatic screenshots
3. **Trace Viewer**: Use the trace viewer to replay tests step by step
4. **Debug Mode**:
   - For basic tests: `npm run test:e2e:debug`
   - For auth tests: `npm run test:e2e:auth:debug`
5. **Headed Mode**:
   - For basic tests: `npm run test:e2e:headed`
   - For auth tests: `npm run test:e2e:auth:headed`

## Troubleshooting

| Issue                        | Solution                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| Port conflicts               | Use the reliable testing approach which automatically handles port conflicts                              |
| Authentication failures      | Check screenshots in tests/e2e/screenshots/ and verify test database credentials                          |
| Test timeouts                | Try increasing the timeouts in .env.test (TIMEOUT_TEST, TIMEOUT_SERVER)                                   |
| Tests hanging/stalling       | Use the `npm run test:e2e` script which has proper timeouts and cleanup                                   |
| "Server health check failed" | Ensure your server is running and accessible at the expected URL. Check console for detailed diagnostics. |
| "Connection refused"         | The server process may have failed to start. Check server logs for errors.                                |
| "Timeout waiting for server" | Try increasing TIMEOUT_SERVER in .env.test or check for server startup issues.                            |
| "Port 3000 already in use"   | Use the reliable runner which automatically manages ports or manually kill processes using port 3000.     |
| Redirects not working        | Check for hardcoded URLs in NEXTAUTH_URL or other environment variables.                                  |

## Best Practices

1. **Use Test IDs**: Add `data-testid` attributes to critical UI elements
2. **Add Diagnostics**: Include screenshots in key points of your test flow
3. **Isolation**: Each test should be independent and not rely on state from other tests
4. **Minimize Flakiness**: Use proper waiting mechanisms and avoid timing-dependent assertions
5. **Mock External Services**: Use a dedicated test database instead of production database
6. **Use the Reliable Runner**: The run-e2e-with-checks.js script handles many common issues automatically
7. **Avoid Hardcoded URLs**: Never use hardcoded URLs like `http://localhost:3000` - always use relative paths or environment variables
8. **Consistent State Management**: Use Playwright's `storageState` for authentication rather than custom cookie management
9. **Choose the Right Selectors**: Prefer user-facing attributes (text, role, label) over CSS selectors

## Authentication Testing

### Current Status

Our E2E testing framework includes authentication tests using NextAuth.js with PostgreSQL:

1. **Authentication Flow**: The authentication tests verify that:
   - The login page loads correctly and displays sign-in options
   - Users can log in with valid credentials
   - The app recognizes the authenticated state correctly
   - Protected routes are properly secured

### Running Auth Tests

To run authentication tests:

```sh
npm run test:e2e:auth-only
```

When auth tests fail, check:

- Screenshots captured in `tests/e2e/screenshots/`
- Network traffic in the Playwright traces
- Server logs for authentication errors

## Advanced Usage

### Testing Against Existing Servers

You can run tests against a server that's already running:

```bash
# Test against the default URL (http://localhost:3336)
npm run test:e2e:against-existing

# Test against a custom URL
npm run test:e2e:custom-url

# Or specify a custom URL directly
cross-env PLAYWRIGHT_TEST_BASE_URL=http://localhost:8000 playwright test
```

This is useful for:

- Testing against a production-like environment
- Running tests against a server with custom configuration
- Avoiding server startup overhead in repeated test runs
- Debugging server issues independently from test execution

The e2e-runner will still perform health checks against the existing server before running tests to ensure it's responsive.

### Port Management and Dynamic URLs

Our testing framework now handles port conflicts automatically:

1. **Automatic Port Selection**: The reliable runner automatically selects available ports
2. **Dynamic URL Management**: Environment variables are set correctly to match the selected ports
3. **Port Conflict Resolution**: Processes using required test ports are automatically detected and can be terminated

This allows tests to run smoothly even when other servers or processes are running on your development machine.

### Test Results Management

Test results and artifacts are stored in organized directories:

- **Screenshots**: `tests/e2e/screenshots/`
- **Traces**: `tests/e2e/traces/`
- **Test Reports**: `playwright-report/`
- **Test Results**: `tests/config/test-results/`

These files are automatically generated during test runs and can be useful for debugging failures.

## Tips for Stable Tests

1. **Use Realistic Timeouts**:

   - Set appropriate timeouts in the test files (`test.setTimeout(30000)`)
   - Use `page.waitForTimeout()` sparingly for stabilization issues

2. **Stable Selectors**:

   - Use data-testid attributes for primary element selection
   - Prefer role-based selectors (getByRole) over text or CSS selectors

3. **Better Assertions**:

   - Use `toBeVisible()` over `toHaveCount(1)` for element presence
   - Use `toHaveText()` with regex for flexible text matching

4. **Handle Authentication Properly**:

   - Use the auth.setup.ts file to pre-authenticate
   - Reuse auth state with `storageState` configuration

5. **Environment Variables**:

   - Use `.env.test` for all test-specific configuration
   - Make sure environment variables are correctly set in CI

6. **Use the Reliable Runner**: The run-e2e-with-checks.js script handles many common issues automatically:

   - Logs scanning for server errors
   - Proper cleanup of resources
   - Coordinated startup of emulators and servers
