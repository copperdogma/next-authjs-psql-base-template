# Testing Strategy

This document provides an overview of the testing approach used in this project.

## Overview

The project uses a comprehensive testing strategy that includes:

- **Unit Testing**: For testing individual components, functions, and API endpoints in isolation
- **Integration Testing**: For testing interactions between components
- **End-to-End (E2E) Testing**: For testing the application as a whole from a user's perspective
- **Visual Regression Testing**: For catching unintended visual changes in the UI

## Frameworks

- **Jest**: For unit and integration tests
- **React Testing Library**: For testing React components
- **Playwright**: For E2E and visual regression testing
- **Supertest**: For testing API endpoints

## Directory Structure

```
tests/
├── config/             # Test configuration files
├── e2e/                # End-to-end tests
│   ├── authenticated/  # Tests that require authentication
│   ├── public/         # Tests that don't require authentication
│   ├── setup/          # Setup files for E2E tests
│   └── utils/          # Utilities for E2E tests
├── integration/        # Integration tests
├── setup/              # General test setup
└── unit/               # Unit tests
    ├── api/            # API tests
    ├── components/     # Component tests
    ├── lib/            # Library tests
    └── utils/          # Utility tests
```

## Running Tests

The project provides several npm scripts for running tests:

- `npm test` or `npm run test`: Run all tests (unit and E2E)
- `npm run test:unit`: Run all unit tests
- `npm run test:watch`: Run unit tests in watch mode
- `npm run test:coverage`: Run unit tests with coverage reporting
- `npm run test:e2e`: Run all E2E tests
- `npm run test:e2e:ui-only`: Run only UI E2E tests
- `npm run test:e2e:auth-only`: Run only authentication E2E tests
- `npm run test:e2e:debug`: Run E2E tests with Playwright's debug mode
- `npm run test:e2e:headed`: Run E2E tests in headed mode (visible browser)
- `npm run test:e2e:report`: View the HTML test report from previous test runs

To run a specific test file:

```bash
npm test <test-file>
```

## Core Utilities

### Unit Testing

The project provides several utilities for unit testing:

- `renderWithProviders`: A wrapper around React Testing Library's `render` function that includes necessary providers (Theme, Redux, etc.)
- `mockSession`: A utility for mocking the NextAuth.js session
- `mockRouter`: A utility for mocking the Next.js router

Example:

```typescript
import { renderWithProviders } from '@/tests/utils/render-with-providers';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<MyComponent />);
    expect(getByText('Hello, World!')).toBeInTheDocument();
  });
});
```

### E2E Testing

The project uses Playwright for E2E testing. Key utilities include:

- `auth.setup.ts`: Sets up authentication for tests that require it
- `test-base.ts`: Provides a base test fixture with common utilities

## Visual Regression Testing

The project uses Playwright's snapshot testing capabilities for visual regression testing. To update snapshots after intentional UI changes:

```bash
npx playwright test --update-snapshots
```

Visual regression tests are stored in the `tests/e2e/public/visual.spec.ts` file. Snapshots are stored in the repository and should be committed with code changes.
