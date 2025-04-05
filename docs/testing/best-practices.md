# Testing Best Practices

This document outlines the best practices for testing in our Next.js application using React Testing Library, Jest-DOM, and Playwright.

## Table of Contents

- [Testing Library Best Practices](#testing-library-best-practices)
- [Jest-DOM Best Practices](#jest-dom-best-practices)
- [ESLint Rules for Testing](#eslint-rules-for-testing)
- [Test Structure Guidelines](#test-structure-guidelines)
- [Test Naming Conventions](#test-naming-conventions)
- [Test Isolation Practices](#test-isolation-practices)
- [E2E Testing Practices](#e2e-testing-practices)

## Testing Library Best Practices

### Query Priority

Always follow this query priority order for the best accessibility:

1. **getByRole** - Most accessible and recommended approach

   ```tsx
   // ✅ Good - uses role and accessible name
   screen.getByRole('button', { name: /submit/i });

   // ❌ Bad - uses less accessible method
   screen.getByTestId('submit-button');
   ```

2. **getByLabelText** - Use for form fields

   ```tsx
   // ✅ Good - connects with label semantically
   screen.getByLabelText(/email address/i);
   ```

3. **getByText** - For non-interactive elements

   ```tsx
   // ✅ Good - finds text content in non-interactive elements
   screen.getByText(/welcome to our app/i);
   ```

4. **getByTestId** - Last resort when semantic queries aren't possible
   ```tsx
   // Only use when other queries won't work
   screen.getByTestId('unique-element');
   ```

### User Interactions

Use `userEvent` for realistic browser behavior:

```tsx
// ✅ Good - uses userEvent with setup pattern
const user = userEvent.setup();
await user.click(screen.getByRole('button'));

// ❌ Bad - uses fireEvent which bypasses event handlers
fireEvent.click(screen.getByRole('button'));
```

### Async Testing

Test asynchronous operations properly:

```tsx
// ✅ Good - uses findBy for async appearance
const submitButton = await screen.findByRole('button', { name: /submit/i });

// ✅ Good - clear error messages in waitFor
await waitFor(
  () => {
    expect(screen.getByText(/success/i)).toBeVisible();
  },
  { timeout: 3000, onTimeout: error => `Timed out waiting for success message: ${error}` }
);

// ❌ Bad - no timeout or error handling
await waitFor(() => expect(element).toBeVisible());
```

## Jest-DOM Best Practices

Use precise Jest-DOM matchers for better error messages:

```tsx
// ✅ Good - specific matcher with better error message
expect(button).toBeDisabled();
expect(element).toBeVisible();
expect(element).toHaveTextContent('Expected text');

// ❌ Bad - generic matchers with unclear errors
expect(button.disabled).toBe(true);
expect(window.getComputedStyle(element).display).not.toBe('none');
expect(element.textContent).toBe('Expected text');
```

### Recommended Matchers

- `toBeVisible()` instead of `toBeInTheDocument()` for visibility
- `toHaveTextContent()` for text assertions
- `toBeDisabled()`, `toBeRequired()` for element state
- `toHaveAccessibleName()` for accessibility testing
- `toHaveAttribute()` for DOM attribute testing
- `toHaveClass()` for class name testing
- `toHaveValue()` for form input values

## ESLint Rules for Testing

We've configured ESLint with testing-library and jest-dom plugins to enforce best practices:

### Testing Library Rules

- `testing-library/await-async-queries` - Ensures async queries are properly awaited
- `testing-library/await-async-utils` - Ensures async utilities are properly awaited
- `testing-library/no-await-sync-queries` - Prevents unnecessary awaits
- `testing-library/no-container` - Discourages direct container queries
- `testing-library/no-debugging-utils` - Warns about debug statements in tests
- `testing-library/prefer-find-by` - Encourages findBy over waitFor+getBy
- `testing-library/prefer-screen-queries` - Encourages screen queries
- `testing-library/prefer-user-event` - Prefers userEvent over fireEvent
- `testing-library/render-result-naming-convention` - Enforces consistent naming

### Jest-DOM Rules

- `jest-dom/prefer-checked` - Use toBeChecked() for checkboxes
- `jest-dom/prefer-empty` - Use toBeEmpty() for empty elements
- `jest-dom/prefer-enabled-disabled` - Use toBeEnabled()/toBeDisabled()
- `jest-dom/prefer-in-document` - Use toBeInTheDocument()
- `jest-dom/prefer-to-have-text-content` - Use toHaveTextContent()
- `jest-dom/prefer-to-have-value` - Use toHaveValue() for inputs

### Jest Plugin Rules

- `jest/consistent-test-it` - Enforces consistent use of `it()` instead of `test()`
- `jest/require-top-level-describe` - Ensures all tests are wrapped in a `describe` block
- `jest/no-identical-title` - Prevents duplicate test names
- `jest/valid-title` - Ensures test titles are valid and useful
- `jest/no-disabled-tests` - Warns about skipped tests with `.skip`
- `jest/no-focused-tests` - Prevents committing focused tests with `.only`
- `jest/no-standalone-expect` - Prevents expectation calls outside of test blocks

## Coverage Standards

We enforce minimum code coverage thresholds to ensure quality and reliability. The current thresholds are:

```json
{
  "statements": 80%,
  "branches": 70%,
  "functions": 80%,
  "lines": 80%
}
```

### Why These Thresholds?

- **Statements (80%)**: Ensures most code paths are executed at least once.
- **Branches (70%)**: Slightly lower threshold for conditional branches, acknowledging some complex edge cases may be impractical to test.
- **Functions (80%)**: Aims for high coverage of function/method entry points.
- **Lines (80%)**: Ensures most code lines are executed during tests.

### Coverage Best Practices

1. **Focus on Critical Logic**: Strive for higher coverage (90%+) on critical business logic and core features.
2. **Quality Over Quantity**: Writing good, meaningful tests is more important than achieving arbitrary coverage numbers.
3. **Uncovered Code**: If code is deliberately left uncovered, consider adding comments explaining why testing is impractical.
4. **Track Changes**: Watch for coverage trends over time - declining coverage may indicate accumulated technical debt.

### Running Coverage Reports

Generate and view coverage reports with:

```bash
# Generate coverage report
npm run test:coverage

# Run coverage for specific files
npm test <test-file> -- --coverage --collectCoverageFrom=<source-file>
```

Coverage reports are available in the `coverage/` directory after running tests with coverage enabled.

## Test Structure Guidelines

Follow these guidelines for writing clean, maintainable tests:

### Arrange-Act-Assert Pattern

```tsx
// Arrange
const { user } = AuthTestUtils.renderWithAuth(<Component />);

// Act
await user.click(screen.getByRole('button'));

// Assert
expect(screen.getByText(/success/i)).toBeVisible();
```

### Using Test Fixtures

Use our shared test fixtures to maintain consistency:

```tsx
// Authentication test fixtures
const { user, mockSignIn } = AuthTestUtils.renderWithAuth(<Component />);
const { user } = AuthTestUtils.renderAuthenticated(<Component />);
const { user } = AuthTestUtils.renderLoading(<Component />);
const { user } = AuthTestUtils.renderWithError(<Component />);

// Mock user creation
const customUser = createMockUser({ displayName: 'Custom Name' });
```

### Naming Conventions

Use clear, behavior-focused test descriptions:

```tsx
// ✅ Good - describes behavior
it('displays error message when form submitted without email', async () => {});

// ❌ Bad - focuses on implementation
it('calls handleSubmit and sets error state', async () => {});
```

## Test Naming Conventions

We enforce consistent test naming conventions using ESLint. These conventions make tests more readable, easier to understand, and better document the expected behavior of our code.

### Required Structure

All tests must follow this structure:

1. Top-level `describe` block that identifies the component, function, or module being tested
2. Individual test cases using `it()` instead of `test()`
3. Descriptive titles that explain expected behavior

```tsx
describe('ComponentName', () => {
  it('should [expected outcome] when [condition/action]', () => {
    // Test code
  });
});
```

### Best Practices for Test Names

1. **Be specific**: Test names should clearly describe what is being tested and the expected behavior
2. **Focus on behavior, not implementation**: Test what the code does, not how it does it
3. **Use the "should/when" pattern**: "should [do something] when [under these conditions]"
4. **Include edge cases in the name**: If testing an edge case, mention it in the name

### Examples

✅ **Good test names:**

```typescript
it('should display error message when form is submitted without email');
it('should call API once with correct parameters when save button is clicked');
it('should display loading indicator when isLoading prop is true');
it('should handle empty arrays gracefully when no items are provided');
```

❌ **Bad test names:**

```typescript
it('works correctly'); // Too vague
it('test submit button'); // Doesn't describe expected outcome
it('handleSubmit'); // Focuses on implementation, not behavior
it('test case 1'); // Meaningless numbering
```

### Enforced Rules

We use ESLint to enforce these naming conventions with the following rules:

- `jest/consistent-test-it`: Ensures we consistently use `it()` instead of `test()`
- `jest/require-top-level-describe`: Ensures all tests are wrapped in a `describe` block
- `jest/no-identical-title`: Prevents duplicate test names
- `jest/valid-title`: Ensures test titles are valid and useful

## Test Isolation Practices

Test isolation means that each test runs independently without affecting or being affected by other tests. Properly isolated tests:

- Are more reliable (don't depend on execution order)
- Are easier to debug when they fail
- Can be run in parallel without issues
- Provide better documentation of the code's behavior

### Component Test Isolation

For React component tests, follow these isolation best practices:

1. **Render fresh for each test**: Either render within each test or use `beforeEach`

```tsx
// ✅ Good - Each test has its own render
describe('Component', () => {
  it('test case 1', () => {
    render(<Component />);
    // Test assertions
  });

  it('test case 2', () => {
    render(<Component />);
    // Different test assertions
  });
});

// ✅ Also good - Using beforeEach for common setup
describe('Component', () => {
  let renderResult;

  beforeEach(() => {
    renderResult = render(<Component />);
  });

  it('test case 1', () => {
    // Use renderResult
  });

  it('test case 2', () => {
    // Use fresh renderResult from beforeEach
  });
});
```

2. **Avoid shared render results**: Don't render once for multiple tests

```tsx
// ❌ Bad - Shared state can leak between tests
describe('Component', () => {
  const { getByText } = render(<Component />);

  it('test case 1', () => {
    // Using shared render result
  });

  it('test case 2', () => {
    // Still using the same component instance!
  });
});
```

3. **Reset mocks between tests**:

```tsx
// ✅ Good practice
const mockFunction = jest.fn();

beforeEach(() => {
  mockFunction.mockClear(); // Reset call history
  // or
  jest.clearAllMocks(); // Reset all mocks
});
```

### Database and External Resource Isolation

For tests that interact with databases or external resources:

1. **Test-specific identifiers**: Create data with unique identifiers per test

```tsx
// Using UUIDs or timestamps for unique test data
it('should store user data', async () => {
  const uniqueEmail = `test-${Date.now()}@example.com`;
  await createUser({ email: uniqueEmail });
  // Test with unique email
});
```

2. **Clean up after tests**: Use `beforeEach` and `afterEach` to reset state

```tsx
// Clean up database between tests
beforeEach(async () => {
  await db.users.deleteMany({}); // Clear users table
});

// Or after each test
afterEach(async () => {
  await db.users.deleteMany({}); // Clear users table
});
```

3. **Transaction isolation**: Wrap tests in transactions that roll back

```tsx
// Using database transactions for isolation
beforeEach(async () => {
  await db.$executeRaw`BEGIN TRANSACTION`;
});

afterEach(async () => {
  await db.$executeRaw`ROLLBACK`;
});
```

4. **Prefer mocking**: When possible, mock external dependencies

```tsx
// Mock API calls instead of making real ones
jest.mock('api/userService', () => ({
  getUser: jest.fn().mockResolvedValue({ id: 1, name: 'Test User' }),
}));
```

### Enforced Rules

We use the following ESLint rule to help enforce test isolation:

- `jest/no-standalone-expect`: Prevents expectation calls outside of test blocks

## E2E Testing Practices

For Playwright E2E tests, follow these practices:

### Use Shared Fixtures

```ts
// Use auth fixtures
test('authenticated user can access dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  await expect(authenticatedPage).toHaveURL('/dashboard');
});

// Use device fixtures
test('responsive design on mobile', async ({ mobilePage }) => {
  await mobilePage.goto('/');
  // Test mobile layout
});
```

### Use Consistent Selectors

```ts
// Use shared selectors from fixtures
test('navigation elements are visible', async ({ page, selectors }) => {
  await page.goto('/');
  await expect(page.locator(selectors.LAYOUT.NAVBAR)).toBeVisible();
});
```

### Test for Accessibility

```ts
// Basic a11y test
test('page should be accessible', async ({ page }) => {
  await page.goto('/');

  // Check for accessibility violations
  const violations = await checkA11y(page);
  expect(violations.length).toBe(0);
});
```

## Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro)
- [Jest-DOM Documentation](https://github.com/testing-library/jest-dom)
- [UserEvent Documentation](https://testing-library.com/docs/user-event/intro)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Playwright Documentation](https://playwright.dev/docs/intro)
