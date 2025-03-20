# E2E Testing with Playwright - Implementation Guide

This directory contains end-to-end tests using Playwright. This README focuses on implementation details specific to this codebase.

> **Note:** For the comprehensive testing guide, see the `/docs/testing/e2e-testing.mdc` file.

## Directory Structure

```
tests/e2e/
├── fixtures/            # Test fixtures and utilities
│   └── auth-fixtures.ts # Firebase authentication helpers
├── auth/                # Authentication tests
│   └── auth-flow.spec.ts # Tests basic auth patterns
├── accessibility.spec.ts # Accessibility compliance tests
├── navigation.spec.ts    # Navigation and structure tests
├── performance.spec.ts   # Performance and loading tests
└── README-e2e.md         # This file
```

## Local Setup

### Installation

Ensure you have installed the required dependencies:

```bash
npm install
npx playwright install  # Installs browser binaries
```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (for debugging)
npm run test:e2e:ui

# Run with debugging
npm run test:e2e:debug

# Show HTML report
npm run test:e2e:report

# Run a specific test file
npx playwright test tests/e2e/auth/auth-flow.spec.ts

# Run tests with a specific browser
npx playwright test --project=chromium
```

## Implementation Notes

### Authentication Helpers

The `fixtures/auth-fixtures.ts` file provides utilities for:

- Mocking Firebase authentication
- Setting up authenticated page contexts
- Cleaning up authentication state

### Test Database

When running tests that require database access:

1. Tests use the `TEST_DATABASE_URL` environment variable
2. Database cleanup happens automatically in the `afterAll` hook

### CSS Selectors

For this project, use selectors in the following priority order:

1. `data-testid` attributes
2. ARIA roles with name matchers
3. Semantic HTML elements
4. CSS classes (only when unavoidable)

### Performance Thresholds

Current performance thresholds are:

- Page load: < 5000ms
- Render blocking resources: Warning only
- Memory usage: < 80% of available heap

### Customization Points

When adding new tests, focus on these customization points:

1. `auth-fixtures.ts`: Update mock user data for your auth implementation
2. Navigation tests: Update route list to match your application
3. Accessibility tests: Adjust excluded rules if needed 