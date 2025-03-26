# Test Fixtures and Utilities

This document provides a guide to the test fixtures and utilities available in the project. These fixtures help make tests more consistent, maintainable, and easier to write.

## Table of Contents
- [Unit Testing Fixtures](#unit-testing-fixtures)
- [End-to-End Testing Fixtures](#end-to-end-testing-fixtures)
- [Common Testing Patterns](#common-testing-patterns)

## Unit Testing Fixtures

### Authentication Fixtures

The `tests/utils/test-fixtures.ts` file provides powerful utilities for testing components that use authentication:

```typescript
import { AuthTestUtils } from '../../utils/test-fixtures';

// Render component with unauthenticated state
AuthTestUtils.renderWithAuth(<YourComponent />);

// Render component with authenticated user
AuthTestUtils.renderAuthenticated(<YourComponent />, {
  // Optional user property overrides
  displayName: 'Custom Name'
});

// Render component with loading state
AuthTestUtils.renderLoading(<YourComponent />);

// Render component with authentication error
AuthTestUtils.renderWithError(<YourComponent />, 'Custom error message');
```

The test utilities return common items needed for testing:

```typescript
const { user, mockSignIn, mockSignOut } = AuthTestUtils.renderWithAuth(<YourComponent />);

// Use userEvent for interactions
await user.click(button);

// Assert on mock functions
expect(mockSignIn).toHaveBeenCalledTimes(1);
```

### Mock User Factory

Create consistent mock users for testing with the `createMockUser` function:

```typescript
import { createMockUser } from '../../utils/test-fixtures';

// Create a default mock user
const user = createMockUser();

// Create a user with custom properties
const customUser = createMockUser({
  displayName: 'Custom Name',
  email: 'custom@example.com'
});
```

### Auth State Fixtures

Use pre-defined auth states for consistent testing:

```typescript
import { AuthStateFixtures } from '../../utils/test-fixtures';

// Not authenticated state
const notAuthState = AuthStateFixtures.notAuthenticated;

// Authenticated state (with optional user overrides)
const authState = AuthStateFixtures.authenticated({ displayName: 'Test User' });

// Loading state
const loadingState = AuthStateFixtures.loading;

// Error state (with optional error message)
const errorState = AuthStateFixtures.error('Authentication failed');
```

## End-to-End Testing Fixtures

The Playwright E2E tests use fixtures defined in `tests/e2e/fixtures/test-fixtures.ts`.

### Common Selectors

Use consistent selectors across all E2E tests:

```typescript
test('Navigation elements are visible', async ({ page, selectors }) => {
  await page.goto('/');
  
  // Use shared selectors for consistency
  await expect(page.locator(selectors.LAYOUT.NAVBAR)).toBeVisible();
  await expect(page.locator(selectors.LAYOUT.MAIN_CONTENT)).toBeVisible();
  await expect(page.locator(selectors.LAYOUT.FOOTER)).toBeVisible();
});
```

### Pre-Authenticated Pages

Test authenticated scenarios easily with pre-configured fixtures:

```typescript
test('Authenticated user can access dashboard', async ({ authenticatedPage }) => {
  // Page is already authenticated with default test user
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage).toHaveURL('/dashboard');
});

// Or for admin scenarios
test('Admin user can access control panel', async ({ adminPage }) => {
  await adminPage.goto('/admin');
  await expect(adminPage).toHaveURL('/admin');
});
```

### Responsive Testing Fixtures

Test across different device sizes with dedicated fixtures:

```typescript
test('Responsive design on mobile', async ({ mobilePage }) => {
  await mobilePage.goto('/');
  // Will use mobile viewport (375x667) with mobile user agent
});

test('Tablet layout displays correctly', async ({ tabletPage }) => {
  await tabletPage.goto('/');
  // Will use tablet viewport (768x1024) with tablet user agent
});

test('Desktop layout displays correctly', async ({ desktopPage }) => {
  await desktopPage.goto('/');
  // Will use desktop viewport (1920x1080)
});
```

### Utility Methods

Convenient helper methods for common test patterns:

```typescript
test('Navigation completion', async ({ page, testUtils }) => {
  await page.goto('/');
  
  // Use testUtils for common operations
  await testUtils.waitForNavigation(page, '/dashboard');
  
  // Check for element existence without waiting/failing
  const exists = await testUtils.elementExists(page, '.optional-element');
  
  // Try multiple selectors until one works
  const element = await testUtils.waitForAnySelector(page, [
    '[data-testid="profile-button"]',
    'button:has-text("Profile")',
    '.profile-link'
  ]);
  
  // Get viewport information for responsive testing
  const viewport = await testUtils.getViewportInfo(page);
  console.log(`Testing on ${viewport.isMobile ? 'mobile' : 'desktop'}`);
  
  // Check basic performance metrics
  const metrics = await testUtils.getPerformanceMetrics(page, '/dashboard');
  expect(metrics.loadTime).toBeLessThan(3000); // 3 seconds max load time
});
```

## Common Testing Patterns

### Setup and Cleanup

Always clear mocks between tests for isolation:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Testing Forms

Test form interactions with userEvent:

```typescript
test('Form submission', async () => {
  const { user } = AuthTestUtils.renderAuthenticated(<MyForm />);
  
  // Fill out form
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  
  // Submit form
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  // Assert on the results
  expect(screen.getByText(/success/i)).toBeVisible();
});
```

### Testing API Calls

Test components that make API calls:

```typescript
// In your test setup
jest.mock('../../api/users', () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: '123', name: 'Test User' })
}));

// In your test
test('Fetches and displays user data', async () => {
  const { user } = AuthTestUtils.renderAuthenticated(<UserProfile userId="123" />);
  
  // Wait for data to load
  await screen.findByText('Test User');
  
  // Assert API was called correctly
  expect(fetchUser).toHaveBeenCalledWith('123');
});
```

### Testing Error Handling

Test how components handle errors:

```typescript
// Mock API to return error
jest.mock('../../api/users', () => ({
  fetchUser: jest.fn().mockRejectedValue(new Error('User not found'))
}));

test('Displays error message when API fails', async () => {
  const { user } = AuthTestUtils.renderAuthenticated(<UserProfile userId="123" />);
  
  // Wait for error message
  await screen.findByText(/user not found/i);
  
  // Test error recovery
  await user.click(screen.getByRole('button', { name: /retry/i }));
});
```

## Best Practices

1. **Use the fixtures** - Use the provided fixtures wherever possible to keep tests consistent.
2. **Test behavior, not implementation** - Focus on what users see and interact with.
3. **Prefer role-based queries** - Use `getByRole` instead of `getByTestId` when possible.
4. **Keep tests isolated** - Ensure tests don't depend on the order or outcome of other tests.
5. **Realistic user interactions** - Use `userEvent` instead of `fireEvent` for more realistic interactions.
6. **Clear mocks between tests** - Reset mocks in `beforeEach` to prevent test contamination.
7. **Small, focused tests** - Each test should verify a specific behavior or feature.

By following these patterns and using the provided fixtures, you'll create more maintainable, consistent, and robust tests. 