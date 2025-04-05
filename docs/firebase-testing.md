# Firebase Emulator Integration for E2E Testing

This document describes how Firebase emulators are integrated with end-to-end (E2E) testing in this project.

## Overview

Firebase emulators allow you to test Firebase services locally without using the production Firebase services. This project uses the following Firebase emulators:

- **Auth Emulator**: For testing authentication flows (sign in, sign up, etc.)
- **Firestore Emulator**: For testing database operations

## Automated Testing Workflow

The E2E tests are designed to automatically manage the Firebase emulators, ensuring a consistent and reliable testing experience:

1. **Emulator Startup**: When running `npm run test:e2e`, the script automatically starts the Firebase emulators with seed data before running tests
2. **Data Clearing**: Playwright's global setup automatically clears emulator data to ensure tests run against a clean state
3. **Test User Setup**: A standard test user is created for authentication tests
4. **Test Execution**: Tests are executed using Playwright
5. **Emulator Shutdown**: When tests are complete, emulators are shut down automatically

## Key Scripts

| Script                              | Description                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run test:e2e`                  | Main E2E test command - starts emulators with seed data, sets up test server, runs all tests |
| `npm run test:e2e:ui-only`          | Runs only UI tests with emulators (no seed data)                                             |
| `npm run test:e2e:auth-only`        | Runs only authentication tests with emulators (no seed data)                                 |
| `npm run test:e2e:with-emulator`    | Alternative way to run all tests with seed data (identical to test:e2e)                      |
| `npm run test:e2e:auth-setup`       | Runs only the auth setup script (useful for preparing authentication for manual testing)     |
| `npm run firebase:emulators`        | Manually starts Firebase emulators (auth + firestore) with clean state                       |
| `npm run firebase:emulators:import` | Manually starts Firebase emulators with seed data                                            |
| `npm run firebase:setup-test-user`  | Creates the standard test user in the Auth emulator                                          |
| `npm run firebase:update-seed-data` | Updates seed data for tests that require pre-populated data                                  |

## Seed Data

Some tests require pre-populated data to function correctly. We use a seed data approach for this:

1. The `firebase-seed-data/` directory contains exported emulator data that can be imported
2. The main `npm run test:e2e` command automatically imports this seed data
3. To update the seed data, run `npm run firebase:update-seed-data`

## Test Implementation Details

- **Data Clearing**: The Playwright `globalSetup` function automatically clears emulator data via REST API calls, ensuring a clean state for each test run
- **Project ID**: All emulator interactions use the project ID 'next-firebase-base-template' by default
- **Emulator Ports**: Auth emulator runs on port 9099, Firestore on port 8080
- **Tests Using Firebase SDK**: All tests using the Firebase SDK should check environment variables to connect to emulators

## Developing Tests

When developing new tests that interact with Firebase services:

1. Ensure tests use the emulator endpoints by checking for environment variables like `FIREBASE_AUTH_EMULATOR_HOST`
2. If your tests require specific initial data, consider updating the seed data
3. For authentication testing, use the standard test user created during the setup phase

## Troubleshooting

If you encounter issues with the emulators:

1. **Emulator Connection Issues**: Ensure no other processes are using the emulator ports (9099 for Auth, 8080 for Firestore)
2. **Data Persistence Issues**: The Playwright global setup should clear data automatically, but you can also run `npm run firebase:clear-data` manually
3. **Authentication Issues**: Ensure the test user is being created correctly by checking the emulator UI at http://localhost:4000

## CI/CD Integration

In the CI/CD pipeline, the same scripts are used, but with the `CI=true` environment variable set, which disables the reuse of existing servers and ensures a clean testing environment.
