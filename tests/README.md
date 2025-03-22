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
const createMockUser = (options: {
  lastSignInTime?: string;
  creationTime?: string;
}): User => {
  return {
    metadata: {
      lastSignInTime: options.lastSignInTime,
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
  
  it('should use creation time if last sign in time is not available', () => {
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