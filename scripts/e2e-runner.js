#!/usr/bin/env node

/**
 * Comprehensive E2E Test Runner
 *
 * This script:
 * 1. Ensures all necessary ports are available (kills conflicting processes)
 * 2. Starts the Next.js server for testing
 * 3. Optionally starts Firebase emulators if requested
 * 4. Runs Playwright tests
 * 5. Performs proper cleanup on exit
 */

const { execSync, spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Configuration
const TEST_PORT = process.env.TEST_PORT || '3336';
const BASE_URL = `http://localhost:${TEST_PORT}`;
const FIREBASE_AUTH_PORT = process.env.FIREBASE_AUTH_PORT || '9099';
const FIREBASE_FIRESTORE_PORT = process.env.FIREBASE_FIRESTORE_PORT || '8080';
const SCREENSHOT_DIR = path.resolve(__dirname, '../tests/e2e/screenshots');

// Command line arguments
const args = process.argv.slice(2);
const testFiles = args.filter(arg => !arg.startsWith('--'));
const isDebug = args.includes('--debug');
const isHeaded = args.includes('--headed');
const withFirebase = args.includes('--with-firebase');
const useExistingServer = args.includes('--use-existing-server');
const customBaseUrl = args.find(arg => arg.startsWith('--base-url='))?.split('=')[1];
const serverUrl = customBaseUrl || BASE_URL;

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  console.log(`Created screenshot directory: ${SCREENSHOT_DIR}`);
}

// Global process references
let serverProcess = null;
let firebaseProcess = null;

/**
 * Clean up port conflicts
 */
function cleanupPorts() {
  console.log('🧹 Cleaning up ports...');
  try {
    // Kill processes using the test port
    const lsofCommand = `lsof -i :${TEST_PORT} -t`;
    const pids = execSync(lsofCommand, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

    if (pids.length > 0) {
      console.log(`Found processes using port ${TEST_PORT}: ${pids.join(', ')}`);
      execSync(`kill -9 ${pids.join(' ')}`, { stdio: 'ignore' });
      console.log(`Killed processes using port ${TEST_PORT}`);
    }

    // If using Firebase, also clean up those ports
    if (withFirebase) {
      const firebasePorts = [FIREBASE_AUTH_PORT, FIREBASE_FIRESTORE_PORT];
      for (const port of firebasePorts) {
        try {
          const firebasePids = execSync(`lsof -i :${port} -t`, { encoding: 'utf8' })
            .trim()
            .split('\n')
            .filter(Boolean);

          if (firebasePids.length > 0) {
            console.log(`Found processes using port ${port}: ${firebasePids.join(', ')}`);
            execSync(`kill -9 ${firebasePids.join(' ')}`, { stdio: 'ignore' });
            console.log(`Killed processes using port ${port}`);
          }
        } catch (error) {
          // Ignore errors for Firebase ports
        }
      }
    }
  } catch (error) {
    // lsof might return a non-zero exit code if no processes are found, which is fine
    if (!error.message.includes('Command failed')) {
      console.error('Error cleaning up ports:', error.message);
    }
  }
}

/**
 * Start Firebase emulators if requested
 */
function startFirebaseEmulators() {
  if (!withFirebase) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    console.log('🔥 Starting Firebase emulators...');

    // Check if we have emulator data to import
    const emulatorDataPath = path.resolve(__dirname, '../.firebase-emulator-data');
    const importFlag = fs.existsSync(emulatorDataPath) ? ['--import', emulatorDataPath] : [];

    // Add a demo project flag to allow the auth emulator to start without authentication
    firebaseProcess = spawn(
      'firebase',
      ['emulators:start', '--only', 'auth,firestore', '--project', 'demo-test', ...importFlag],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      }
    );

    let isFirebaseReady = false;
    const firebaseStartTimeout = setTimeout(() => {
      if (!isFirebaseReady) {
        console.error('❌ Firebase emulators failed to start within timeout');
        reject(new Error('Firebase emulator timeout'));
      }
    }, 30000);

    firebaseProcess.stdout.on('data', data => {
      const output = data.toString();
      process.stdout.write(`[Firebase] ${output}`);

      if (
        output.includes('All emulators ready') ||
        (output.includes('Auth Emulator') && output.includes('Firestore Emulator'))
      ) {
        isFirebaseReady = true;
        clearTimeout(firebaseStartTimeout);
        console.log('✅ Firebase emulators are ready');

        // Setup test user in Firebase Auth emulator
        console.log('👤 Setting up test user in Firebase Auth emulator...');
        try {
          execSync('node scripts/setup-test-user.js', { stdio: 'inherit' });
          console.log('✅ Test user setup complete');
        } catch (error) {
          console.error('⚠️ Error setting up test user:', error.message);

          // Continue anyway, as the test might still work
        }

        resolve();
      }
    });

    firebaseProcess.stderr.on('data', data => {
      process.stderr.write(`[Firebase Error] ${data.toString()}`);
    });

    firebaseProcess.on('error', error => {
      console.error(`❌ Failed to start Firebase emulators: ${error.message}`);
      clearTimeout(firebaseStartTimeout);
      reject(error);
    });

    firebaseProcess.on('close', code => {
      if (code !== null && code !== 0) {
        console.error(`❌ Firebase emulators process exited with code ${code}`);
        if (!isFirebaseReady) {
          clearTimeout(firebaseStartTimeout);
          reject(new Error(`Firebase emulators exited with code ${code}`));
        }
      }
    });
  });
}

/**
 * Start the Next.js server for testing
 */
function startServer() {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Starting Next.js server on port ${TEST_PORT}...`);

    // Set proper environment variables
    const serverEnv = {
      ...process.env,
      NODE_ENV: 'test',
      PORT: TEST_PORT,
    };

    // Add Firebase environment variables if needed
    if (withFirebase) {
      serverEnv.FIREBASE_AUTH_EMULATOR_HOST = `localhost:${FIREBASE_AUTH_PORT}`;
      serverEnv.FIRESTORE_EMULATOR_HOST = `localhost:${FIREBASE_FIRESTORE_PORT}`;
    }

    serverProcess = spawn('next', ['dev', '-p', TEST_PORT], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: serverEnv,
      shell: true,
    });

    let isServerReady = false;
    const serverStartTimeout = setTimeout(
      () => {
        if (!isServerReady) {
          console.error('❌ Server failed to start within timeout');
          reject(new Error('Server startup timeout'));
        }
      },
      parseInt(process.env.TIMEOUT_SERVER || 30000, 10)
    );

    serverProcess.stdout.on('data', data => {
      const output = data.toString();
      process.stdout.write(`[Server] ${output}`);

      if (output.includes('Ready') || output.includes('ready')) {
        isServerReady = true;
        clearTimeout(serverStartTimeout);
        console.log(`✅ Next.js server is ready on ${BASE_URL}`);
        resolve();
      }
    });

    serverProcess.stderr.on('data', data => {
      process.stderr.write(`[Server Error] ${data.toString()}`);
    });

    serverProcess.on('error', error => {
      console.error(`❌ Failed to start server: ${error.message}`);
      clearTimeout(serverStartTimeout);
      reject(error);
    });

    serverProcess.on('close', code => {
      if (code !== null && code !== 0) {
        console.error(`❌ Server process exited with code ${code}`);
        if (!isServerReady) {
          clearTimeout(serverStartTimeout);
          reject(new Error(`Server exited with code ${code}`));
        }
      }
    });
  });
}

/**
 * Check server health with retries
 *
 * @param {string} url - Base URL to check
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} interval - Interval between retries in ms
 * @returns {Promise<boolean>} - Whether server is healthy
 */
async function checkServerHealth(url, maxRetries = 5, interval = 2000) {
  console.log(`🩺 Checking server health at ${url}...`);

  // Use node-fetch if available, otherwise fall back to require
  let fetch;
  try {
    fetch = (await import('node-fetch')).default;
  } catch (e) {
    try {
      fetch = require('node-fetch');
    } catch (e) {
      // If node-fetch is not available, use execSync as fallback
      console.log('⚠️ node-fetch not available, using curl fallback');
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          execSync(`curl -s ${url}/api/health`, { timeout: 5000 });
          console.log('✅ Server is healthy and responding');

          return true;
        } catch (error) {
          console.log(`⚠️ Server health check attempt ${attempt}/${maxRetries} failed`);
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, interval));
          }
        }
      }

      return false;
    }
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Server is healthy and responding (uptime: ${data.uptime.toFixed(2)}s)`);

        return true;
      }

      console.log(
        `⚠️ Server health check attempt ${attempt}/${maxRetries} failed: Status ${response.status}`
      );
    } catch (error) {
      console.log(
        `⚠️ Server health check attempt ${attempt}/${maxRetries} failed: ${error.message}`
      );
    }

    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, interval));
    }
  }

  // Display prominent error message
  console.error(`
┌─────────────────────────────────────────────────────────────┐
│ 🔥 SERVER CONNECTION ERROR                                  │
│                                                             │
│ Could not connect to the Next.js server at:                 │
│ ${url}                                                      │
│                                                             │
│ Possible causes:                                            │
│ 1. Server is not running                                    │
│ 2. Server is running on a different port                    │
│ 3. Server started but crashed or is unresponsive            │
│ 4. Network or firewall issues                               │
│                                                             │
│ Try:                                                        │
│ - Run 'npm run dev' in a separate terminal                  │
│ - Check for errors in the server logs                       │
│ - Verify TEST_PORT in .env.test matches the server port     │
└─────────────────────────────────────────────────────────────┘
`);

  return false;
}

/**
 * Run Playwright tests with the specified options
 * @param {boolean} useExistingServer Whether we're using an existing server or started our own
 * @returns {Promise<number>} Exit code from the test run
 */
async function runTests(useExistingServer = false) {
  const testCommand = [
    'npx',
    'playwright',
    'test',
    ...(testFiles.length > 0 ? testFiles : []),
    '--config=tests/config/playwright-reliable.config.ts',
    isDebug ? '--debug' : '',
    isHeaded ? '--headed' : '',
  ].filter(Boolean);

  console.log(`🧪 Running tests: ${testCommand.join(' ')}`);

  // Set environment variables for the test process
  const env = {
    ...process.env,
    PLAYWRIGHT_TEST_BASE_URL: serverUrl,

    // Add additional env vars for debugging if needed
    DEBUG_MODE: isDebug ? 'true' : 'false',
  };

  return new Promise(resolve => {
    const testProcess = spawn(testCommand[0], testCommand.slice(1), {
      env,
      stdio: 'inherit',
      shell: true,
    });

    testProcess.on('close', code => {
      console.log(`🏁 Tests completed with exit code: ${code}`);
      resolve(code || 0);
    });
  });
}

/**
 * Cleanup function
 */
function cleanup(exitCode = 0) {
  console.log('🧹 Cleaning up...');

  // Kill any remaining processes
  try {
    // Kill Next.js server
    const lsofCommand = `lsof -i :${TEST_PORT} -t`;
    const pids = execSync(lsofCommand, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);

    if (pids.length > 0) {
      console.log(`Shutting down server on port ${TEST_PORT}...`);
      execSync(`kill -9 ${pids.join(' ')}`, { stdio: 'ignore' });
    }

    // Kill Firebase emulators if they were started
    if (withFirebase) {
      const firebasePorts = [FIREBASE_AUTH_PORT, FIREBASE_FIRESTORE_PORT];
      for (const port of firebasePorts) {
        try {
          const firebasePids = execSync(`lsof -i :${port} -t`, { encoding: 'utf8' })
            .trim()
            .split('\n')
            .filter(Boolean);

          if (firebasePids.length > 0) {
            console.log(`Shutting down Firebase emulator on port ${port}...`);
            execSync(`kill -9 ${firebasePids.join(' ')}`, { stdio: 'ignore' });
          }
        } catch (error) {
          // Ignore errors for Firebase ports
        }
      }
    }
  } catch (error) {
    // Ignore errors from lsof
  }

  console.log('✅ Cleanup complete');

  // Show report command
  console.log('\nTo view test results, run:');
  console.log('  npx playwright show-report\n');

  process.exit(exitCode);
}

// Handle termination signals
process.on('SIGINT', () => cleanup());
process.on('SIGTERM', () => cleanup());

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting E2E Test Runner');
  console.log(`🔧 Test files: ${testFiles.length > 0 ? testFiles.join(', ') : 'all tests'}`);
  console.log(
    `🔧 Options: ${
      [
        withFirebase && 'with Firebase',
        isDebug && 'debug mode',
        isHeaded && 'headed mode',
        useExistingServer && `using existing server at ${serverUrl}`,
      ]
        .filter(Boolean)
        .join(', ') || 'none'
    }`
  );

  try {
    // Always clean up ports unless using existing server
    if (!useExistingServer) {
      cleanupPorts();
    }

    // Start Firebase emulators if needed
    if (withFirebase) {
      await startFirebaseEmulators();
    }

    // Start server unless using existing one
    if (!useExistingServer) {
      await startServer();
    } else {
      console.log(`🔌 Using existing server at ${serverUrl}`);

      // Perform health check on existing server
      const isHealthy = await checkServerHealth(serverUrl);
      if (!isHealthy) {
        throw new Error(`Existing server at ${serverUrl} is not responding to health checks`);
      }
    }

    // Run tests
    const exitCode = await runTests(useExistingServer);

    // Clean up and exit with proper code
    await cleanup(exitCode);
    process.exit(exitCode);
  } catch (error) {
    console.error(`❌ Error during test setup: ${error.message}`);
    await cleanup(1);
    process.exit(1);
  }
}

// Main execution
main();
