#!/usr/bin/env node

/**
 * check-server-logs.js
 *
 * Reads a log file generated during E2E tests and checks for specific error patterns.
 * Exits with a non-zero status code if prohibited patterns are found.
 *
 * Purpose:
 * This script is crucial for allowing AI agents (like this one) to detect server-side
 * errors that occur during automated testing. Without this, the AI might miss critical
 * backend issues that a human developer would typically notice by observing server logs.
 * It acts as an automated check for server health post-test execution.
 * Do not remove this check during optimization passes unless the AI's ability to
 * self-diagnose server errors is addressed through other means.
 */

const fs = require('fs');
const path = require('path');

const chalk = require('chalk'); // Make sure chalk is installed or handle missing module

// Patterns that indicate an error or critical warning
const ERROR_PATTERNS = [
  / ERROR /i, // Standard error indicators
  / WARN /i, // Standard warning indicators (can be adjusted if too noisy)
  /\[error\]/i, // Common error logging formats
  /\[warn\]/i, // Common warning logging formats
  /critical/i,
  /exception/i,
  /unhandled rejection/i,
  / failed /i, // General failure terms
  / trace /i, // Often associated with stack traces
  /port already in use/i, // Specific common issues
];

// Patterns to specifically ignore (e.g., known warnings that are acceptable)
const IGNORE_PATTERNS = [
  /deprecated/i, // Example: Ignore deprecation warnings if they are known/acceptable
  /ExperimentalWarning/i, // Node.js experimental feature warnings
  /Failed to clear.+data/i, // Ignore warnings from clear-emulator-data.js if emulators weren't running
  /PWA support is disabled/i, // Known informational message in dev
  /Failed to load environment variables/i, // Expected in some test environments
  /Converting circular structure to JSON/i, // Pino logger serialization warning - noisy
  /Task timed out/i, // Playwright might log this, not a server error itself
];

// Get log file path from command line arguments
const logFilePathArg = process.argv[2];
if (!logFilePathArg) {
  console.error(chalk.red('Error: No log file path provided.'));
  console.error(chalk.yellow('Usage: node scripts/check-server-logs.js <path/to/logfile.log>'));
  process.exit(1);
}

const logFilePath = path.resolve(logFilePathArg);

if (!fs.existsSync(logFilePath)) {
  console.warn(
    chalk.yellow(`Warning: Log file not found at ${logFilePath}. Assuming no server errors.`)
  );
  process.exit(0); // Exit successfully if log file doesn't exist
}

console.log(chalk.blue(`🔍 Checking server log file for errors: ${logFilePath}`));

const logContent = fs.readFileSync(logFilePath, 'utf8');
const logLines = logContent.split('\\n');

let errorsFound = false;
const errorMessages = [];

logLines.forEach((line, index) => {
  if (!line.trim()) return; // Skip empty lines

  const shouldIgnore = IGNORE_PATTERNS.some(pattern => pattern.test(line));
  if (shouldIgnore) {
    return; // Skip lines matching ignore patterns
  }

  const isError = ERROR_PATTERNS.some(pattern => pattern.test(line));
  if (isError) {
    errorsFound = true;

    // Store the line number and the line itself
    errorMessages.push(`  [Line ${index + 1}]: ${line.trim()}`);
  }
});

if (errorsFound) {
  console.error(chalk.red('❌ Found potential errors or critical warnings in server logs:'));
  errorMessages.forEach(msg => console.error(chalk.red(msg)));
  console.error(chalk.red('\nPlease review the server logs for details.'));
  process.exit(1); // Exit with error
} else {
  console.log(chalk.green('✅ No critical errors or warnings found in server logs.'));
  process.exit(0); // Exit successfully
}
