# E2E Testing with Playwright and Firebase Emulators

This document provides an overview of the end-to-end testing setup for this project, which uses Playwright for browser automation and Firebase Emulators for backend testing.

## Key Features

- **Playwright Test Framework**: Automated browser testing with Chromium
- **Firebase Emulator Integration**: Tests run against local Firebase emulators
- **Authentication Testing**: Pre-authenticated test user for protected routes
- **Accessibility Testing**: Automated accessibility audits with Axe
- **Responsive Design Testing**: Tests for both mobile and desktop viewports
- **Continuous Integration**: GitHub Actions workflow for automated testing

## Test Structure

The tests are organized into several projects within the Playwright configuration:

1. **`setup`**: Handles authentication setup, creating a reusable authenticated state
2. **`ui-tests`**: Basic UI tests that don't require authentication
3. **`chromium`**: Tests that run with authentication enabled
4. **`api`**: Tests for API endpoints without browser rendering

## Running Tests

### Basic Test Commands

- **Run all tests**: `npm run test:e2e`
- **Run UI tests only**: `npm run test:e2e:ui`
- **Run authenticated tests**: `npm run test:e2e:auth`
- **Run in debug mode**: `npm run test:e2e:debug`
- **Run in headed mode**: `npm run test:e2e:headed`
- **View test report**: `npm run test:e2e:report`

### Tests with Firebase Emulators

- **Run with emulators**: `npm run test:e2e:with-emulator`
- **Complete test suite**: `npm run test:e2e:full`

### Authentication Setup

- **Setup authentication state**: `npm run test:e2e:setup`

## Test Development Guidelines

### Best Practices

1. **Use Role-Based Selectors**: Prefer `page.getByRole()`, `getByLabel()`, and `getByText()` over CSS selectors for better test resilience.

2. **Avoid Timeouts**: Use Playwright's auto-waiting mechanisms instead of explicit waits. For example:

   ```typescript
   // Good - relies on Playwright's auto-waiting
   await expect(page.getByRole('button')).toBeVisible();

   // Bad - uses explicit timeout
   await page.waitForTimeout(1000);
   ```

3. **Test Isolation**: Ensure tests don't depend on each other's state. Each test should set up its own prerequisites and clean up after itself.

4. **Error Handling**: Use Playwright's built-in retry and timeout mechanisms for flaky operations rather than custom retry loops.

5. **Accessibility Testing**: Include accessibility checks in your tests using the built-in Axe integration.

### Adding New Tests

1. Create a new test file in the appropriate directory:

   - `/tests/e2e/` for general UI tests
   - `/tests/e2e/auth/` for authentication-related tests
   - `/tests/e2e/api/` for API tests

2. Use the existing test files as templates for the proper setup.

3. If your test requires authentication, make sure it's in a project that depends on the `setup` project.

## Firebase Emulator Integration

Tests utilize local Firebase emulators for Auth, which provides several benefits:

- No interaction with production Firebase resources
- Consistent, deterministic test environment
- Fast test execution with no network delays
- No billing costs for test operations

The Firebase emulators are automatically started before tests run and shut down afterward.

## Troubleshooting

### Common Issues

1. **Port conflicts**: If tests fail with port-in-use errors, ensure no previous test processes are running:

   ```
   npx kill-port 3777 9099
   ```

2. **Authentication issues**: If tests can't access protected routes:

   - Make sure the emulators are running
   - Check that auth setup is completed with `npm run test:e2e:setup`
   - Verify the test user exists in the Auth emulator

3. **Flaky tests**: Some tests may be timing-sensitive. Try running with `--retries=3` flag.

### Debugging

- Use `npm run test:e2e:debug` to open the Playwright Inspector
- Check screenshots in the `tests/e2e/screenshots` directory
- Examine the test report with `npm run test:e2e:report`

## Continuous Integration

Tests run automatically on GitHub Actions when:

- Code is pushed to the main branch
- Pull requests are created against the main branch

The workflow caches dependencies and emulators for faster execution.
