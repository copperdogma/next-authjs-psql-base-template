#!/usr/bin/env node

/**
 * E2E test runner helper script
 *
 * This script starts the test server on the port defined in .env.test,
 * waits for it to be available, runs the Playwright tests, then cleans up.
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const dotenv = require('dotenv');

// Load test environment variables
const envFile = path.resolve(__dirname, '../.env.test');
if (existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

// Configuration
const PORT = process.env.PORT || 3333;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_TIMEOUT = parseInt(process.env.TIMEOUT_TEST || '120000', 10);

console.log(`
🚀 Starting E2E Test Runner
📋 Test configuration:
   - Port: ${PORT}
   - Base URL: ${BASE_URL}
   - Test timeout: ${TEST_TIMEOUT}ms
`);

// Check if we should start Firebase emulators
const useFirebaseEmulators = process.env.USE_FIREBASE_EMULATOR === 'true';
let firebaseProcess = null;

// Start the Firebase emulators if needed
if (useFirebaseEmulators) {
  console.log('🔥 Starting Firebase emulators...');
  firebaseProcess = spawn('npm', ['run', 'firebase:emulators'], {
    stdio: 'inherit',
    shell: true,
  });

  // Give emulators time to start
  console.log('⏳ Waiting for Firebase emulators to start...');
  setTimeout(() => {
    console.log('✅ Firebase emulators should be running now');
  }, 5000);
}

// Playwright will handle starting the webserver through the configuration
// Let's just kick off the tests
console.log('🧪 Running Playwright tests...');
const playwrightArgs = process.argv.slice(2);
const playwrightProcess = spawn('npx', ['playwright', 'test', ...playwrightArgs], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PLAYWRIGHT_TEST_BASE_URL: BASE_URL,
  },
});

// Handle clean up
const cleanup = () => {
  if (firebaseProcess) {
    console.log('🧹 Stopping Firebase emulators...');
    firebaseProcess.kill('SIGINT');
  }
  process.exit();
};

// Handle process exits
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

playwrightProcess.on('exit', code => {
  console.log(`📝 Playwright tests finished with code ${code}`);
  cleanup();
});
