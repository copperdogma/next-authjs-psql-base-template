#!/usr/bin/env node

/**
 * Script to run authenticated E2E tests
 * This script checks if a server is running, starts one if needed, and runs both the
 * auth setup and authenticated tests in sequence
 */

const { spawn } = require('child_process');
const { existsSync } = require('fs');
const http = require('http');
const path = require('path');

const dotenv = require('dotenv');

// Load test environment variables
const envFile = path.resolve(__dirname, '../.env.test');
if (existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

// Configuration
const PORT = process.env.TEST_PORT || 3334;
const BASE_URL = `http://localhost:${PORT}`;
let serverProcess = null;

console.log('🚀 Starting authentication tests process...');

// Check if server is already running
function checkServerRunning(callback) {
  console.log(`🔍 Checking if server is already running on ${BASE_URL}...`);

  http
    .get(BASE_URL, res => {
      console.log(`✅ Server already running on ${PORT} (Status: ${res.statusCode})`);
      callback(true);
    })
    .on('error', () => {
      console.log(`❌ No server running on ${PORT}, will start one`);
      callback(false);
    });
}

// Start server if needed, then run tests
checkServerRunning(isRunning => {
  if (!isRunning) {
    // Start Next.js server in test mode
    console.log('🌐 Starting test server...');
    serverProcess = spawn('npm', ['run', 'test:server'], {
      stdio: 'inherit',
      shell: true,
    });

    // Give the server time to start
    console.log('⏳ Waiting 10 seconds for server to start...');
    setTimeout(runTests, 10000);
  } else {
    // Server already running, run tests immediately
    runTests();
  }
});

// Run the Playwright tests
function runTests() {
  console.log('🔐 Running auth setup...');

  // First run the auth setup
  const setupProcess = spawn('npx', ['playwright', 'test', '--project=setup'], {
    stdio: 'inherit',
    shell: true,
  });

  setupProcess.on('exit', setupCode => {
    if (setupCode !== 0) {
      console.error(`❌ Auth setup failed with code ${setupCode}`);
      cleanup(setupCode);

      return;
    }

    console.log('✅ Auth setup completed, running authenticated tests...');

    // Then run the authenticated tests
    const testProcess = spawn('npx', ['playwright', 'test', '--project=authenticated'], {
      stdio: 'inherit',
      shell: true,
    });

    testProcess.on('exit', testCode => {
      console.log(`📝 Tests finished with code ${testCode}`);
      cleanup(testCode);
    });
  });
}

// Handle cleanup
const cleanup = (exitCode = 0) => {
  if (serverProcess) {
    console.log('🧹 Cleaning up...');
    serverProcess.kill('SIGINT');
  }
  process.exit(exitCode);
};

// Handle process exits
process.on('SIGINT', () => cleanup());
process.on('SIGTERM', () => cleanup());
