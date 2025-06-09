# Testing Guide

This document serves as the comprehensive guide for all testing activities in this Next.js application with NextAuth.js and PostgreSQL.

## Overview

Our testing strategy employs multiple layers:

- **Unit Tests**: Testing individual components, functions, and services in isolation
- **Integration Tests**: Testing interactions between components and systems
- **End-to-End (E2E) Tests**: Testing complete user workflows in a real browser environment

## Frameworks & Tools

- **Jest**: Unit and integration test runner with coverage reporting
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end browser testing
- **jest-mock-extended**: Simple and effective Prisma client mocking
- **node-mocks-http**: API route testing utilities

## Running Tests

### Unit and Integration Tests

```bash
# Run all unit tests (default for local development)
npm run test:unit

# Run unit tests in watch mode
npm run test:unit:watch

# Run unit tests with coverage report
npm run test:unit:coverage

# Run comprehensive test suite (unit + E2E)
npm run test

# Run comprehensive test suite for CI
npm run test:ci
```

### End-to-End Tests

```bash
# Run all E2E tests (most comprehensive)
npm run test:e2e

# Run only authentication-related E2E tests
npm run test:e2e:auth-only

# Run only public/unauthenticated E2E tests
npm run test:e2e:public-only

# Run only authenticated E2E tests
npm run test:e2e:authenticated-only

# Debug E2E tests with browser visible
npm run test:e2e:debug

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Update visual regression snapshots
npm run test:e2e:update-snapshots

# View HTML test report
npm run test:e2e:report
```

## Unit & Integration Testing

### Jest Multi-Project Configuration

Our Jest setup uses a multi-project configuration to handle different testing environments:

- **jsdom project**: For React components and browser-like environments
- **node project**: For server-side code, API routes, and Node.js utilities

This configuration automatically determines the correct environment based on file location and content.

### Component Testing

Components are tested using React Testing Library with our custom rendering utilities:

```typescript
import { renderWithProviders } from '@/tests/utils/test-utils';
import { MyComponent } from '@/components/MyComponent';

test('should render component correctly', () => {
  const { getByRole } = renderWithProviders(<MyComponent />);
  expect(getByRole('button')).toBeInTheDocument();
});
```

### API Route Testing

API routes are tested by importing the handler directly and using `node-mocks-http`:

```typescript
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/user/me/route';

test('should return user data for authenticated user', async () => {
  const { req, res } = createMocks({ method: 'GET' });
  // Mock session data and test the handler
});
```

### Database Mocking Strategy

We use `jest-mock-extended` for simple and effective Prisma client mocking:

```typescript
import { prismaMock } from '@/__mocks__/db/prismaMocks';

beforeEach(() => {
  // prismaMock is automatically reset with sensible defaults
});

test('should create user', async () => {
  prismaMock.user.create.mockResolvedValue(mockUser);
  // Test your service function
});
```

### ESM and TypeScript Support

Our Jest configuration includes:

- **SWC transformation** for fast TypeScript compilation
- **ESM module support** for modern JavaScript features
- **Automatic mocking** of CSS imports and Next.js components
- **Path mapping** support for `@/` imports

## End-to-End Testing

### Playwright Project Structure

Tests are organized into Playwright projects:

- **setup**: Authentication setup (runs first)
- **unauthenticated-tests**: Public pages and UI components (`tests/e2e/public/`)
- **authenticated-chromium**: Protected routes and features (`tests/e2e/authenticated/`)

### Authentication Strategy

E2E tests use NextAuth.js authentication with storage state reuse:

1. **Setup project** authenticates a test user and saves the session
2. **Authenticated tests** reuse this stored authentication state
3. **Public tests** run without authentication

### Test Organization

```
tests/e2e/
├── setup/
│   └── auth.setup.ts          # Authentication setup
├── public/                    # Unauthenticated tests
│   ├── accessibility.spec.ts
│   ├── navigation.spec.ts
│   └── theme-toggle.spec.ts
├── authenticated/             # Authenticated tests
│   ├── auth/                  # Authentication flow tests
│   └── profile/               # Profile management tests
└── utils/                     # Test utilities and helpers
```

### Debugging E2E Tests

When tests fail, use these debugging approaches:

```bash
# Run with debug mode (step through tests)
npm run test:e2e:debug

# Run with visible browser
npm run test:e2e:headed

# Check test results and traces
npm run test:e2e:report
```

Playwright automatically captures:

- Screenshots on failure
- Video recordings (on failure)
- Trace files for step-by-step debugging

## Code Coverage

### Coverage Thresholds

The project maintains high code coverage standards:

- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

### Coverage Reports

```bash
# Generate coverage report
npm run test:unit:coverage

# View coverage report
open coverage/lcov-report/index.html
```

Coverage reports exclude:

- Test files and mocks
- Configuration files
- Type definitions
- Generated files

## Testing Best Practices

### Unit Tests

1. **Test behavior, not implementation details**
2. **Use descriptive test names**
3. **Keep tests focused and isolated**
4. **Mock external dependencies**
5. **Test error cases and edge conditions**

### Integration Tests

1. **Test realistic user scenarios**
2. **Use minimal mocking**
3. **Test API contract compliance**
4. **Verify database interactions**

### E2E Tests

1. **Focus on critical user paths**
2. **Use data attributes for reliable element selection**
3. **Implement proper waiting strategies**
4. **Keep tests independent and isolated**
5. **Use page object patterns for complex flows**

## Environment Configuration

### Test Environment Variables

Tests use environment-specific configuration:

- **Unit/Integration**: Uses `.env.test` and in-memory mocks
- **E2E**: Uses `.env.test` with test database

### Database Testing

- **Unit tests**: Use mocked Prisma client (no database connection)
- **Integration tests**: Use test database with automatic cleanup
- **E2E tests**: Use test database with real NextAuth.js flows

## Continuous Integration

The test suite is designed for CI environments:

- **Parallel execution** where possible
- **Deterministic results** with proper cleanup
- **Comprehensive reporting** with coverage and traces
- **Fast feedback** with optimized test selection

```yaml
# Example CI configuration
- name: Run Tests
  run: |
    npm run test:ci
    npm run test:e2e
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Tests automatically handle port cleanup
2. **Database connection**: Ensure test database is accessible
3. **Authentication state**: Clear `.auth/` directory if auth tests fail
4. **Flaky tests**: Use proper waiting strategies and stable selectors

### Debug Commands

```bash
# Check test database connection
npm run test:unit tests/integration/database.test.ts

# Verify E2E server startup
npm run ai:start && npm run ai:health

# Reset authentication state
rm -rf tests/.auth/
```

This guide covers the complete testing infrastructure. For specific testing patterns or advanced scenarios, refer to the existing test files as examples.
