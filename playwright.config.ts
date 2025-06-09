import { PlaywrightTestConfig, defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

/**
 * Root-level Playwright configuration
 *
 * Follows best practices for Next.js and E2E testing
 */

// Unconditionally load .env.test variables into process.env
// This will ensure they are available for the webServer command and the tests themselves.
const envTestPath = path.resolve(__dirname, '.env.test');
console.log(`[Playwright Config] Attempting to load .env.test from: ${envTestPath}`);
const result = dotenv.config({ path: envTestPath, override: true });
if (result.error) {
  console.error('[Playwright Config] Error loading .env.test:', result.error);
  // throw new Error(`Failed to load .env.test: ${result.error.message}`);
} else {
  console.log('[Playwright Config] .env.test loaded successfully. PARSED:', result.parsed);
}

// Configuration constants with environment variable fallbacks
const PORT = process.env.TEST_PORT || '3777';
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${PORT}`;
const TIMEOUT_TEST = parseInt(process.env.TIMEOUT_TEST || '60000', 10);
const TIMEOUT_SERVER = parseInt(process.env.TIMEOUT_SERVER || '180000', 10);
const TEST_RETRIES = process.env.CI ? 2 : 1;

console.log('🔍 Playwright Configuration:');
console.log(`PORT: ${PORT}`);
console.log(`BASE_URL: ${BASE_URL}`);
console.log(`TIMEOUT_TEST: ${TIMEOUT_TEST}`);
console.log(`TIMEOUT_SERVER: ${TIMEOUT_SERVER}`);

// Authentication state file paths
export const STORAGE_STATE = path.join(__dirname, 'tests/.auth/user.json');
export const MOBILE_STORAGE_STATE = path.join(__dirname, 'tests/.auth/mobile-user.json');

// Ensure the auth directory exists
const authDir = path.dirname(STORAGE_STATE);
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}
if (!fs.existsSync(STORAGE_STATE)) {
  fs.writeFileSync(
    STORAGE_STATE,
    JSON.stringify({
      cookies: [],
      origins: [],
    })
  );
}
// Create mobile storage state file if it doesn't exist
if (!fs.existsSync(MOBILE_STORAGE_STATE)) {
  fs.writeFileSync(
    MOBILE_STORAGE_STATE,
    JSON.stringify({
      cookies: [],
      origins: [],
    })
  );
}

const config: PlaywrightTestConfig = defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/test-results',
  timeout: TIMEOUT_TEST,
  expect: { timeout: 15000 }, // Reasonable expectation timeout
  fullyParallel: true, // Set to true to enable parallel test execution
  forbidOnly: !!process.env.CI,
  retries: TEST_RETRIES,
  workers: process.env.CI ? 1 : undefined, // Force serial execution on CI, use default otherwise
  reporter: process.env.CI ? [['html']] : [['list'], ['html', { open: 'never' }]],
  // Comment out old globalSetup reference - it's no longer needed
  // globalSetup: './tests/e2e/global-setup.ts',
  // globalSetup: require.resolve('./tests/e2e/global-setup.ts'), // Use require.resolve for compatibility

  use: {
    baseURL: BASE_URL,
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    testIdAttribute: 'data-testid',
  },

  projects: [
    // Authentication setup project - runs first to set up auth state
    {
      name: 'setup',
      testDir: './tests/e2e/setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // UI tests that don't require authentication
    {
      name: 'unauthenticated-tests',
      testDir: './tests/e2e/public',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Authenticated tests in Chromium
    {
      name: 'authenticated-chromium',
      testDir: './tests/e2e/authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE, // Use the state saved by the 'setup' project
      },
      dependencies: ['setup'], // Ensure setup runs first
    },

    // Mobile tests
    {
      name: 'Mobile Chrome',
      testDir: './tests/e2e/authenticated',
      use: {
        ...devices['Pixel 7'],
        storageState: MOBILE_STORAGE_STATE, // Use mobile-specific storage state
      },
      dependencies: ['setup'],
    },

    // API tests - no browser needed
    // Uncomment to enable dedicated API tests project
    // {
    //   name: 'api',
    //   testDir: './tests/e2e/api',
    //   use: {
    //     // No browser is needed for API tests
    //     baseURL: BASE_URL,
    //   },
    // },

    // Uncomment to add Firefox testing
    {
      name: 'firefox',
      testDir: './tests/e2e/authenticated',
      use: {
        ...devices['Desktop Firefox'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],

  // Built-in webServer configuration - manages Next.js server for tests
  webServer: {
    /**
     * Use E2E_SERVER_COMMAND for local development and CI.
     * Fallback to a simpler command if E2E_SERVER_COMMAND is not set.
     */
    command: './scripts/run-e2e-server.sh',
    url: `http://127.0.0.1:${PORT}/api/health`,
    timeout: TIMEOUT_SERVER, // Keep a generous timeout for server start
    reuseExistingServer: !process.env.CI,
    // Let stdout/stderr pass through for better debugging if needed
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
      ALLOW_TEST_ENDPOINTS: 'true',
      NEXT_PUBLIC_IS_E2E_TEST_ENV: 'true',
      // Add any other environment variables needed for testing
    },
  },
});

export default config;
