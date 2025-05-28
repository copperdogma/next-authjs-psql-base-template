# Testing Documentation

This README documents the testing improvements made to the codebase and best practices being followed.

## Testing Structure

Our tests are organized into the following categories:

- `tests/unit`: Unit tests for individual components and functions
- `tests/integration`: Integration tests that verify interactions between components
- `tests/e2e`: End-to-end tests using Playwright
- `tests/utils`: Shared test utilities and helpers

## Jest Best Practices

We've implemented the following best practices in our test suite:

### 1. Test Structure and Organization

We follow the Arrange-Act-Assert (AAA) pattern consistently:

```typescript
// Example from UserProfile.test.tsx
it('renders loading state initially', () => {
  // Arrange
  const wrapper = (props) => (
    <Wrapper value={{ user: null, loading: true }}>
      {props.children}
    </Wrapper>
  );

  // Act
  render(<UserProfile />, { wrapper });

  // Assert
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

### 2. Testing React Components

We focus on testing behavior over implementation details:

```typescript
// Good: Testing from user perspective
expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

// Avoid: Testing implementation details
expect(component.state.isLoading).toBe(true);
```

### 3. Mocking Best Practices

We use realistic mocks that closely match actual behavior:

```typescript
// Example from token.test.ts
const createMockUser = (options: { lastLoginTime?: string; creationTime?: string }): User => {
  return {
    metadata: {
      lastLoginTime: options.lastLoginTime,
      creationTime: options.creationTime,
    },
  } as unknown as User;
};
```

### 4. Test Performance and Reliability

We ensure proper cleanup in all component tests:

```typescript
// Example from CleanupExample.test.tsx
describe('Component with Proper Cleanup', () => {
  // Store original values
  const originalDateNow = Date.now;

  afterEach(() => {
    // Clean up DOM
    cleanup();

    // Reset mocks
    jest.clearAllMocks();

    // Restore original values
    global.Date.now = originalDateNow;
  });
});
```

### 5. Integration with Next.js

We've improved server component testing with dedicated utilities:

```typescript
// Example usage from server-component-utils.tsx
it('should render server component correctly', async () => {
  const { getByText } = await renderServerComponent(ServerComponent, { prop: 'value' });
  expect(getByText('Expected content')).toBeTruthy();
});
```

### 6. Code Coverage and Quality

We've improved test coverage for utility functions:

```typescript
// Example from token.test.ts
describe('shouldRefreshToken', () => {
  it('should return true if token is about to expire', () => {
    // Test implementation...
  });

  it('should use creation time if last login time is not available', () => {
    // Test implementation...
  });

  it('should return true if no time stamps are available', () => {
    // Test implementation...
  });
});
```

## Running Tests

```bash
# Run all Jest tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run e2e tests with Playwright
npm run test:e2e
```

## E2E Testing with Playwright

This project uses Playwright for end-to-end (E2E) testing. E2E tests simulate real user interactions with your application in a browser environment.

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode for debugging
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Generate and view test report
npm run test:e2e:report
```

### Authentication Testing

For testing authentication flows, this project uses NextAuth.js with PostgreSQL. The setup is configured to:

1. Use a test database for authentication
2. Create a test user in the database
3. Perform login via the UI in a setup script
4. Save the authentication state for authenticated tests
5. Use the saved state for tests that require an authenticated user

To run E2E tests:

```bash
# Run all E2E tests
npm run test:e2e

# Run only authentication tests
npm run test:e2e:auth-only
```

### E2E Test Structure

The E2E tests are organized as follows:

- `tests/e2e/` - Main directory for E2E tests
  - `tests/e2e/auth/` - Authentication-related tests
    - `ui-login-logout.spec.ts` - Tests for the login/logout UI flow
  - `tests/setup/` - Setup files for Playwright tests
    - `auth.setup.ts` - Authentication setup that runs before tests

### Authentication Testing Strategy

The project uses two approaches for authentication testing:

1. **Testing Auth UI Flow**: Direct UI testing of the login and logout functionality.

   - These tests don't use pre-authenticated state
   - Located in `tests/e2e/auth/ui-login-logout.spec.ts`
   - Configured as a separate Playwright project (`auth-ui-tests`)

2. **Testing Authenticated Features**: Tests for features that require a logged-in user.
   - Uses Playwright's `storageState` to share authenticated sessions
   - Setup script (`tests/setup/auth.setup.ts`) logs in once and saves the state
   - All other tests use the saved state to avoid repetitive login
   - Great for testing protected routes and features

### Environment Configuration

Authentication testing requires specific environment variables:

- `TEST_USER_EMAIL` - Email for the test user
- `TEST_USER_PASSWORD` - Password for the test user

These variables are pre-configured in `.env.test` for convenience.
