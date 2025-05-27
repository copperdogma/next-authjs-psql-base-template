# Project Testing Overview

This project employs a comprehensive testing strategy combining unit tests, integration tests (via unit test environment), and end-to-end (E2E) tests to ensure code quality, functionality, and reliability.

## Testing Frameworks

- **Jest:** Used for unit and integration testing.
  - Runs tests in two separate environments configured in `jest.config.js`:
    - `jsdom`: For testing React components and browser-specific utilities.
    - `node`: For testing backend logic, API routes, database interactions, and Node.js utilities.
  - Uses `@swc/jest` for faster TypeScript/JSX transformation.
  - Employs `@testing-library/react` for component testing.
  - Includes coverage reporting and thresholds.
- **Playwright:** Used for end-to-end testing across real browsers (Chromium by default).
  - Configuration in `playwright.config.ts`.
  - Includes features like automatic server startup (`webServer` option), authentication state management (`global-setup.ts`), and accessibility checks (`@axe-core/playwright`).
  - Uses custom scripts (`scripts/run-e2e-with-checks.js`) for enhanced execution, including server log scanning for errors.

## Running Tests

Refer to the main `README.md` or `project-reference.mdc` for a detailed list of `npm run test:*` commands.

- `npm test`: Runs the primary unit and E2E test suites.
- `npm run test:unit`: Runs only Jest unit/integration tests.
- `npm run test:e2e`: Runs only Playwright E2E tests (includes emulator setup and server start).
