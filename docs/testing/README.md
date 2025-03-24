# Testing Documentation

## E2E Testing with Playwright

This project uses Playwright for end-to-end testing. There are several scripts available to run these tests:

### Standard Test Scripts

- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Run tests with Playwright UI
- `npm run test:e2e:debug` - Run tests in debug mode

### Dynamic Port Allocation

The project includes special scripts for running tests with dynamic port allocation, which is useful for CI environments or when you need to avoid port conflicts:

#### Using ts-node

We use ts-node to run TypeScript scripts directly without requiring a separate compilation step. The following optimized scripts are available:

- `npm run test:e2e:dynamic` - Runs tests with dynamic port allocation using ts-node with the `--transpile-only` flag for better performance
- `npm run test:e2e:dynamic:optimized` - Same as above but with additional memory allocation (`--max-old-space-size=4096`) for larger projects
- `npm run test:e2e:dynamic:paths` - Adds support for TypeScript path aliases using tsconfig-paths
- `npm run test:e2e:dynamic:tsx` - Alternative implementation using tsx instead of ts-node for potentially better performance

#### Best Practices for ts-node Usage

- Use ts-node only for development and testing, not for production
- Prefer the `--transpile-only` flag to skip type checking when running scripts
- Consider using tsx for better performance in newer projects
- For production deployment, always compile TypeScript to JavaScript using tsc

## Unit and Integration Testing

The project uses Jest for unit and integration testing:

- `npm run test` - Run all tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests

## Test Configuration

Test configuration files are located in the `tests/config` directory. The dynamic port allocation script is in `tests/config/run-tests.ts`.
