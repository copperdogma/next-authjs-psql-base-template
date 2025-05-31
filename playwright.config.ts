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

// Authentication state file path
export const STORAGE_STATE = path.join(__dirname, 'tests/.auth/user.json');

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

const config: PlaywrightTestConfig = defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/test-results',
  timeout: TIMEOUT_TEST,
  expect: { timeout: 15000 }, // Reasonable expectation timeout
  fullyParallel: true, // Set to true to enable parallel test execution
  forbidOnly: !!process.env.CI,
  retries: TEST_RETRIES,
  workers: 1, // Force serial execution
  reporter: [['list'], ['html', { open: 'never' }]],
  // Comment out globalSetup as it causes ESM issues
  // globalSetup: './tests/e2e/global-setup.ts',
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'), // Use require.resolve for compatibility

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
    // Comment out setup project
    // {
    //   name: 'setup',
    //   testMatch: /.*\.setup\.ts/,
    // },
    {
      name: 'setup',
      testMatch: /setup\/auth\.setup\.ts/, // Point to the specific setup file
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // UI tests that don't require authentication

    {
      name: 'ui-tests',
      // Match basic navigation, simple tests, public access, specific non-auth flows
      testMatch: [
        /navigation-improved\.spec\.ts/,
        /simple\.spec\.ts/,
        /public-access\.spec\.ts/,
        /theme-toggle\.spec\.ts/,
        /accessibility-improved\.spec\.ts/, // Assuming this doesn't strictly need auth
        /basic\.spec\.ts/,
        /ultra-basic\.spec\.ts/,
        /auth\/registration\.spec\.ts/, // Keep this specific inclusion
      ],
      // Explicitly ignore tests known to require auth state or are handled by other projects
      testIgnore: [
        // Specific auth tests to ignore for this unauthenticated 'ui-tests' project
        /auth\/login-logout-cycle\.spec\.ts/,
        /auth\/redirect\.test\.ts/,
        /auth\/auth-flow\.spec\.ts/, // Assuming this needs auth or is complex
        // General patterns for other categories
        /profile\/.*\.spec\.ts/,
        /dashboard\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Authenticated tests in Chromium

    {
      name: 'chromium',
      // Define tests that *require* authentication
      testMatch: [
        /auth\/login-logout-cycle\.spec\.ts/,
        /auth\/redirect\.test\.ts/,
        /auth\/auth-flow\.spec\.ts/, // Assuming this needs auth or is complex
        // General patterns for other categories
        /profile\/.*/, // All tests in the profile directory
      ],
      // You might still want to explicitly ignore the non-auth tests if patterns overlap
      testIgnore: [
        /.*\.setup\.ts/, // Always ignore setup
        /navigation-improved\.spec\.ts/,
        /simple\.spec\.ts/,
        /public-access\.spec\.ts/,
        /theme-toggle\.spec\.ts/,
        /accessibility-improved\.spec\.ts/,
        /basic\.spec\.ts/,
        /ultra-basic\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE, // Use the state saved by the 'setup' project
      },
      dependencies: ['setup'], // Ensure setup runs first
    },

    // API tests - no browser needed
    // Comment out api project
    // {
    //   name: 'api',
    //   testMatch: /api\/.*\.spec\.ts/,
    //   use: {
    //     // No browser is needed for API tests
    //   },
    // },

    // Uncomment to add Firefox testing
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: STORAGE_STATE,
    //   },
    //   dependencies: ['setup'],
    //   testIgnore: /navigation|accessibility|performance|basic\.spec\.ts/,
    // },
  ],

  // Built-in webServer configuration - manages Next.js server for tests

  webServer: {
    /**
     * Use E2E_SERVER_COMMAND for local development and CI.
     * Fallback to a simpler command if E2E_SERVER_COMMAND is not set.
     */
    // command: `npm run dev:testserver`, // Original command
    command: './scripts/run-e2e-server.sh',
    url: `http://127.0.0.1:${PORT}/api/health`,
    timeout: TIMEOUT_SERVER, // Keep a generous timeout for server start
    reuseExistingServer: !process.env.CI,
    // Let stdout/stderr pass through for better debugging if needed
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

export default config;
