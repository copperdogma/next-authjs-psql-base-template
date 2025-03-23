# Testing Guide

This document provides an overview of testing in the {{YOUR_PROJECT_NAME}} application. For more detailed information, please refer to the MDC (Markdown for Cursor) files that provide context-sensitive documentation.

## Test Directory Structure

We've centralized all tests in a unified `/tests` directory with the following structure:

```
/tests/                   # Centralized test directory
  /unit/                  # Unit tests for components and APIs
    /api/                 # API endpoint tests
    /components/          # React component tests
  /integration/           # Integration tests
  /e2e/                   # Playwright E2E tests
    /auth/                # Authentication tests
    /fixtures/            # Test fixtures
    accessibility.spec.ts # Accessibility tests
    navigation.spec.ts    # Navigation tests
    performance.spec.ts   # Performance tests
  /mocks/                 # Shared test mocks
  /utils/                 # Shared test utilities
  /config/                # Test configurations
    /jest.config.js       # Jest configuration
    /playwright.config.ts # Playwright configuration
    /setup/               # Test setup files
```

## Testing Documentation Structure

Our testing documentation is organized in a hierarchical structure:

1. **Cursor Rules (MDC Files)**: These files provide context-sensitive documentation that automatically loads when working with different test types.

2. **Implementation READMEs**: Located in test directories, these files contain specific implementation details for each test suite.

## MDC Documentation

The following MDC files provide in-depth guidance for testing:

- **testing-guide.mdc**: Overall testing approach and philosophy
- **unit-testing.mdc**: Component and function testing
- **api-testing.mdc**: API endpoint testing
- **e2e-testing.mdc**: End-to-end testing with Playwright

These files are automatically loaded in AI contexts when working with the corresponding test files.

## Implementation Details

For implementation-specific details, refer to the README files in each test directory:

- **/tests/README-main.md**: Unit and API test implementation details
- **/tests/e2e/README-e2e.md**: E2E test implementation details

## Test Commands

```bash
# Unit and API Tests
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report

# E2E Tests
npm run test:e2e        # Run all E2E tests
npm run test:e2e:ui     # Run E2E tests with UI mode
npm run test:e2e:debug  # Run E2E tests with debugging
npm run test:e2e:report # View E2E test report
```

## Authentication Testing

### Mocking Authentication

Authentication is mocked directly in the test files to ensure proper isolation between tests:

```typescript
// Mock modules before imports (with relative path)
jest.mock('../../../lib/firebase', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
  })),
}));

// Then import components and Firebase modules
import SignInButton from '../../../components/auth/SignInButton';
import { render, screen, fireEvent } from '../../utils/test-utils';
```

### Managing Auth State in Tests

The authentication state is managed by directly manipulating the `currentUser` property:

```typescript
// Mock user data
const mockUser = {
  displayName: 'Test User',
  email: 'test@example.com',
  uid: 'test-user-id',
  getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
};

beforeEach(() => {
  // Reset auth state
  (auth as any).currentUser = null;
});

test('signed in state', () => {
  // Set current user
  (auth as any).currentUser = mockUser;
});
```

## Coverage Requirements

### Global Thresholds

- Statements: 85%
- Branches: 75%
- Functions: 70%
- Lines: 85%

## Best Practices

1. **Mock Declaration**: Define mocks before imports
2. **Test Isolation**: Reset mocks and state in `beforeEach`
3. **Cleanup**: Reset mocks in `afterEach` with `jest.resetAllMocks()`
4. **Type Safety**: Use TypeScript casting for read-only properties
5. **User Actions**: Use `fireEvent` for interactions
6. **Async**: Use `waitFor` before assertions
7. **Relative Imports**: Use relative imports in test files to improve maintainability

## Test Types

1. **Unit Tests**

   - Individual component testing
   - Function and utility testing
   - API endpoint testing
   - Isolated testing with mocks

2. **Integration Tests**

   - Component interaction testing
   - API integration testing
   - Database integration testing
   - Service integration testing

3. **E2E Tests**

   - User flow testing
   - Authentication flows
   - Critical path testing
   - Performance testing
   - Accessibility testing

4. **Specialized Tests**
   - Security testing
   - Performance benchmarks
   - Accessibility compliance
   - Browser compatibility

## Test Data Management

1. **Test Fixtures**

   - Maintain in `/tests/fixtures`
   - Use TypeScript interfaces
   - Keep data minimal
   - Version control fixtures

2. **Mock Data**

   - Centralize in `/tests/mocks`
   - Use TypeScript types
   - Document mock behavior
   - Keep mocks simple

3. **Test Utils**
   - Share common utilities
   - Maintain type safety
   - Document usage
   - Test the utils
