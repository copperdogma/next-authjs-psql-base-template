# Testing Documentation

## E2E Testing with Playwright

This project uses Playwright for end-to-end testing. There are several scripts available to run these tests:

### Test Scripts

- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Run only UI tests that don't require authentication
- `npm run test:e2e:auth` - Run authenticated tests using the pre-configured test user
- `npm run test:e2e:api` - Run API endpoint tests without browser
- `npm run test:e2e:debug` - Run tests in debug mode
- `npm run test:e2e:headed` - Run tests with visible browser windows
- `npm run test:e2e:report` - Show HTML report from the last test run

### Test Architecture

The tests are organized into several projects:

1. `setup` - Sets up authentication state for tests that require login
2. `ui-tests` - Basic UI tests that don't require authentication
3. `chromium` - Authenticated tests running in Chrome
4. `api` - API endpoint tests that don't require a browser

All tests use the built-in `webServer` functionality to start a Next.js server automatically with the correct environment variables.

### Health Checks

Before running tests, the system performs comprehensive health checks:

- Verifies the Firebase Auth emulator is running
- Confirms the application server is responding
- Checks the health endpoint returns the expected status

## Unit and Integration Testing

The project uses Jest for unit and integration testing:

- `npm run test` - Run all tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run test:unit` - Run only unit tests
- `npm run test:unit:watch` - Run unit tests in watch mode

## Environment Configuration

Test environment configuration is stored in `.env.test`. When running E2E tests:

- The server runs on port 3777 (configured in `.env.test` as TEST_PORT)
- Firebase Auth emulator runs on port 9099

## Development Testing

For development with AI assistance, use these scripts:

- `npm run ai:start` - Start the dev server in background mode using PM2
- `npm run ai:stop` - Stop the PM2-managed server
- `npm run ai:logs` - Show logs from the PM2-managed server
- `npm run ai:health` - Check server health
