#!/usr/bin/env node

/**
 * Dynamic E2E Test URL Runner
 *
 * This script:
 * 1. Determines the appropriate port from environment variables
 * 2. Constructs a base URL using that port
 * 3. Runs the E2E tests with the dynamically determined URL
 */

const { spawnSync } = require('child_process');

const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.test' });

// Determine the port to use, with fallbacks
const port = process.env.TEST_PORT || process.env.PORT || '3000';
const baseUrl = `http://localhost:${port}`;

console.log(`Using dynamically determined base URL: ${baseUrl}`);

// Parse command-line arguments
const args = process.argv.slice(2);
const useFirebase = args.includes('--with-firebase');
const isDebug = args.includes('--debug');
const isHeaded = args.includes('--headed');

// Build the arguments for the e2e-runner script
const runnerArgs = ['scripts/e2e-runner.js', '--use-existing-server', `--base-url=${baseUrl}`];

// Add optional arguments
if (useFirebase) runnerArgs.push('--with-firebase');
if (isDebug) runnerArgs.push('--debug');
if (isHeaded) runnerArgs.push('--headed');

// Add any test files specified
args
  .filter(arg => !arg.startsWith('--'))
  .forEach(file => {
    runnerArgs.push(file);
  });

console.log(`Running e2e-runner with args: ${runnerArgs.join(' ')}`);

// Run the e2e-runner script with the constructed arguments
const result = spawnSync('node', runnerArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    TEST_PORT: port,
  },
});

// Exit with the same status code
process.exit(result.status);
