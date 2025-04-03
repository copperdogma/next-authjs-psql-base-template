import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Extract timeout values from environment variables with defaults
const TIMEOUT_TEST = parseInt(process.env.TIMEOUT_TEST || '30000', 10);
const TIMEOUT_NAVIGATION = parseInt(process.env.TIMEOUT_NAVIGATION || '10000', 10);
const TIMEOUT_ACTION = parseInt(process.env.TIMEOUT_ACTION || '5000', 10);

/**
 * Enhanced configuration for reliable E2E testing
 * This config is designed to work with the e2e-runner.js script for maximum reliability
 */
export default defineConfig({
  testDir: '../e2e',
  timeout: TIMEOUT_TEST,

  // Reduce test flakiness by running sequentially
  fullyParallel: false,
  forbidOnly: !!process.env.CI,

  // Error handling settings
  retries: process.env.CI ? 2 : 1,
  workers: 1,

  // Reporting configuration
  reporter: [['html', { open: 'never' }], ['list']],

  // Global test artifacts for debugging
  outputDir: 'test-results',
  preserveOutput: 'failures-only',

  use: {
    // Base URL specified via environment variable from the e2e-runner.js
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3336',

    // Enhanced tracing and debugging settings
    trace: process.env.DEBUG_MODE === 'true' ? 'on' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    // More reliable navigation and action timeouts
    navigationTimeout: TIMEOUT_NAVIGATION,
    actionTimeout: TIMEOUT_ACTION,

    // Additional settings for better reliability
    bypassCSP: true,
    ignoreHTTPSErrors: true,

    // Apply viewport to most closely match real user experience
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Additional Chrome-specific settings for reliability
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
    },
    // Add more browser projects if needed
  ],
});
