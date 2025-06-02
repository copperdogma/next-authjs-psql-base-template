# Tests for next-auth-psql-app

This directory contains all tests for the next-auth-psql-app application.

## Directory Structure

```
tests/
├── unit/                  # Unit tests
│   ├── components/       # Component tests
│   └── api/             # API endpoint tests
├── integration/          # Integration tests
├── e2e/                 # End-to-end tests
│   ├── auth/           # Authentication tests
│   └── fixtures/       # Test fixtures
├── mocks/               # Test mocks
├── utils/               # Test utilities
└── config/              # Test configurations
    ├── jest.config.js   # Jest configuration
    └── playwright.config.ts # Playwright configuration
```

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Types

### Unit Tests

- Test individual components and functions
- Use Jest and React Testing Library
- Focus on isolated functionality

### Integration Tests

- Test component interactions
- Use Jest and React Testing Library
- Verify component integration

### E2E Tests

- Test full user flows
- Use Playwright
- Verify end-to-end functionality

## Best Practices

1. Test Isolation

   - Each test should be independent
   - Clean up after each test
   - Use proper mocking

2. Naming Conventions

   - Descriptive test names
   - Follow `describe` and `it` patterns
   - Group related tests

3. Coverage

   - Aim for 80%+ coverage
   - Focus on critical paths
   - Don't test implementation details

4. Mocking
   - Mock external dependencies
   - Use test doubles appropriately
   - Keep mocks simple

## Example Tests

### Component Test

```typescript
import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### API Test

```typescript
import { GET } from '@/app/api/health/route';

describe('Health Check API', () => {
  it('returns 200 OK', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });
});
```

### E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('user can sign in', async ({ page }) => {
  await page.goto('/login');
  await page.click('[data-testid="sign-in-button"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/docs/intro)
