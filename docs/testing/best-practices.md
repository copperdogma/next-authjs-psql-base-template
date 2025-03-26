# Testing Best Practices

This document outlines the best practices for testing in our Next.js application using React Testing Library, Jest-DOM, and Playwright.

## Table of Contents
- [Testing Library Best Practices](#testing-library-best-practices)
- [Jest-DOM Best Practices](#jest-dom-best-practices)
- [ESLint Rules for Testing](#eslint-rules-for-testing)
- [Test Structure Guidelines](#test-structure-guidelines)
- [E2E Testing Practices](#e2e-testing-practices)

## Testing Library Best Practices

### Query Priority

Always follow this query priority order for the best accessibility:

1. **getByRole** - Most accessible and recommended approach
   ```tsx
   // ✅ Good - uses role and accessible name
   screen.getByRole('button', { name: /submit/i })
   
   // ❌ Bad - uses less accessible method
   screen.getByTestId('submit-button')
   ```

2. **getByLabelText** - Use for form fields
   ```tsx
   // ✅ Good - connects with label semantically
   screen.getByLabelText(/email address/i)
   ```

3. **getByText** - For non-interactive elements
   ```tsx
   // ✅ Good - finds text content in non-interactive elements
   screen.getByText(/welcome to our app/i)
   ```

4. **getByTestId** - Last resort when semantic queries aren't possible
   ```tsx
   // Only use when other queries won't work
   screen.getByTestId('unique-element')
   ```

### User Interactions

Use `userEvent` for realistic browser behavior:

```tsx
// ✅ Good - uses userEvent with setup pattern
const user = userEvent.setup()
await user.click(screen.getByRole('button'))

// ❌ Bad - uses fireEvent which bypasses event handlers
fireEvent.click(screen.getByRole('button'))
```

### Async Testing

Test asynchronous operations properly:

```tsx
// ✅ Good - uses findBy for async appearance
const submitButton = await screen.findByRole('button', { name: /submit/i })

// ✅ Good - clear error messages in waitFor
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeVisible()
}, { timeout: 3000, onTimeout: (error) => 
  `Timed out waiting for success message: ${error}` 
})

// ❌ Bad - no timeout or error handling
await waitFor(() => expect(element).toBeVisible())
```

## Jest-DOM Best Practices

Use precise Jest-DOM matchers for better error messages:

```tsx
// ✅ Good - specific matcher with better error message
expect(button).toBeDisabled()
expect(element).toBeVisible()
expect(element).toHaveTextContent('Expected text')

// ❌ Bad - generic matchers with unclear errors
expect(button.disabled).toBe(true)
expect(window.getComputedStyle(element).display).not.toBe('none')
expect(element.textContent).toBe('Expected text')
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

## Test Structure Guidelines

Follow these guidelines for writing clean, maintainable tests:

### Arrange-Act-Assert Pattern

```tsx
// Arrange
const { user } = AuthTestUtils.renderWithAuth(<Component />)

// Act
await user.click(screen.getByRole('button'))

// Assert
expect(screen.getByText(/success/i)).toBeVisible()
```

### Using Test Fixtures

Use our shared test fixtures to maintain consistency:

```tsx
// Authentication test fixtures
const { user, mockSignIn } = AuthTestUtils.renderWithAuth(<Component />)
const { user } = AuthTestUtils.renderAuthenticated(<Component />)
const { user } = AuthTestUtils.renderLoading(<Component />)
const { user } = AuthTestUtils.renderWithError(<Component />)

// Mock user creation
const customUser = createMockUser({ displayName: 'Custom Name' })
```

### Naming Conventions

Use clear, behavior-focused test descriptions:

```tsx
// ✅ Good - describes behavior
it('displays error message when form submitted without email', async () => {})

// ❌ Bad - focuses on implementation
it('calls handleSubmit and sets error state', async () => {})
```

## E2E Testing Practices

For Playwright E2E tests, follow these practices:

### Use Shared Fixtures

```ts
// Use auth fixtures
test('authenticated user can access dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard')
  await expect(authenticatedPage).toHaveURL('/dashboard')
})

// Use device fixtures
test('responsive design on mobile', async ({ mobilePage }) => {
  await mobilePage.goto('/')
  // Test mobile layout
})
```

### Use Consistent Selectors

```ts
// Use shared selectors from fixtures
test('navigation elements are visible', async ({ page, selectors }) => {
  await page.goto('/')
  await expect(page.locator(selectors.LAYOUT.NAVBAR)).toBeVisible()
})
```

### Test for Accessibility

```ts
// Basic a11y test
test('page should be accessible', async ({ page }) => {
  await page.goto('/')
  
  // Check for accessibility violations
  const violations = await checkA11y(page)
  expect(violations.length).toBe(0)
})
```

## Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro)
- [Jest-DOM Documentation](https://github.com/testing-library/jest-dom)
- [UserEvent Documentation](https://testing-library.com/docs/user-event/intro)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Playwright Documentation](https://playwright.dev/docs/intro) 