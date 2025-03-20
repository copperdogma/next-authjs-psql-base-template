import { PlaywrightTestConfig } from '@playwright/test';
import baseConfig from './tests/config/playwright.config';

/**
 * Root-level Playwright configuration for {{YOUR_PROJECT_NAME}}
 * 
 * NOTE: This configuration file exists for two purposes:
 * 1. To provide a convenient entry point for running tests from the project root
 * 2. To allow IDE integrations to detect and run Playwright tests
 * 
 * The actual test configuration is defined in ./tests/config/playwright.config.ts
 * This file simply re-exports that configuration with any project-specific overrides.
 * 
 * Run tests with either:
 * - `npx playwright test` (uses this config)
 * - `npm run test:e2e` (uses the config in tests/config)
 * 
 * @see https://playwright.dev/docs/test-configuration
 */

// Create the config by spreading the base config
const config: PlaywrightTestConfig = {
  ...baseConfig,
  
  // Override any settings needed for root-level execution if necessary
  // Most settings should be defined in the base config
};

export default config; 