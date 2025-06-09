# Testing Suite

## Overview

Comprehensive testing strategy using Jest (unit/integration), Playwright (E2E), and React Testing Library (components).

## Directory Structure

```
tests/
├── config/             # Test configuration files
├── e2e/                # End-to-end tests (Playwright)
│   ├── authenticated/  # Tests requiring authentication
│   ├── public/         # Unauthenticated tests
│   ├── setup/          # E2E setup files
│   └── utils/          # E2E utilities
├── unit/               # Unit tests (Jest)
│   ├── api/            # API endpoint tests
│   ├── components/     # React component tests
│   └── lib/            # Library/utility tests
└── utils/              # Shared test utilities
```

## Running Tests

```bash
npm test                    # All tests (unit + E2E)
npm run test:unit          # Unit tests with coverage
npm run test:watch         # Unit tests in watch mode
npm run test:e2e           # All E2E tests
npm run test:e2e:auth-only # Authentication E2E tests only
npm run test:e2e:debug     # E2E tests with Playwright debugger
npm run test:e2e:report    # View HTML test report
```

## Core Utilities

### Unit Testing

- `renderWithProviders()` from `@/tests/utils/test-utils` - Renders components with SessionProvider and ThemeProvider
- `renderWithAuth()` - Renders with authenticated session
- `mockSession` - Mock NextAuth.js session data

### E2E Testing

- `auth.setup.ts` - Creates authenticated storage state for tests
- `test-base.ts` - Extended Playwright fixtures with auth context
- Visual regression tests use `--update-snapshots` to refresh baselines

## Playwright Projects

- `setup` - Authentication setup (runs first)
- `unauthenticated-tests` - Public routes and UI components
- `authenticated-chromium` - Tests requiring authentication
- `Mobile Chrome` - Mobile viewport testing

## AI Development

Use PM2-managed server for interactive development:

```bash
npm run ai:start    # Start background server
npm run ai:health   # Check server status
npm run ai:logs     # View server logs
```
