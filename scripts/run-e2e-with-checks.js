const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../logs/e2e-server-run.log');
const errorPatterns = [
  /ERROR/i,
  /WARN/i,
  /Exception/i,
  /SEVERE/i,
  /FATAL/i,
  /Unhandled Rejection/i,
  /Traceback/i,
]; // Add more patterns as needed

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const playwrightArgs = [];
  const specificTestFiles = [];

  // Extract any arguments after '--' as direct Playwright arguments
  const doubleHyphenIndex = args.indexOf('--');
  if (doubleHyphenIndex !== -1) {
    playwrightArgs.push(...args.slice(doubleHyphenIndex + 1));
  }

  // Process remaining arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') break; // Stop at the separator

    // Handle special flags
    if (arg === '--debug') {
      playwrightArgs.push('--debug');
    } else if (arg === '--headed') {
      playwrightArgs.push('--headed');
    } else if (arg.startsWith('--project=')) {
      playwrightArgs.push(arg);
    } else if (!arg.startsWith('--')) {
      // Assume it's a test file path
      specificTestFiles.push(arg);
    }
  }

  return { playwrightArgs, specificTestFiles };
}

function scanLogForErrors(filePath) {
  console.log(`\\nScanning server log for errors: ${filePath}`);
  try {
    if (!fs.existsSync(filePath)) {
      console.warn('Log file not found. Skipping error check.');

      return [];
    }

    const logContent = fs.readFileSync(filePath, 'utf-8');
    const lines = logContent.split('\n');
    const errorsFound = [];

    for (const line of lines) {
      for (const pattern of errorPatterns) {
        if (pattern.test(line)) {
          errorsFound.push(line);
          break; // Move to the next line once an error is found in this one
        }
      }
    }

    return errorsFound;
  } catch (error) {
    console.error(`Error reading or scanning log file: ${error.message}`);

    return [`Failed to scan log file: ${error.message}`]; // Return error to indicate failure
  }
}

function runE2ETests() {
  // Parse arguments
  const { playwrightArgs, specificTestFiles } = parseArgs();

  // 1. Delete the old log file
  try {
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
      console.log(`Deleted previous log file: ${logFilePath}`);
    }
  } catch (error) {
    console.error(`Could not delete log file: ${error.message}`);

    // Decide if this is fatal - maybe not, the redirect will overwrite
  }

  // Construct the test command with appropriate arguments
  let testRunCommand =
    'npm run firebase:setup-test-user && cross-env PLAYWRIGHT_TEST_BASE_URL=http://localhost:3777 playwright test';
  if (playwrightArgs.length > 0) {
    testRunCommand += ` ${playwrightArgs.join(' ')}`;
  }
  if (specificTestFiles.length > 0) {
    testRunCommand += ` ${specificTestFiles.join(' ')}`;
  }

  // 2. Run the start-server-and-test command
  const testCommand = `start-server-and-test 'npm run firebase:emulators:import' http://localhost:9099 'npm run dev:test' http://localhost:3777 '${testRunCommand}'`;
  let playwrightPassed = true;

  console.log(`\\nStarting E2E tests with command:\\n${testCommand}\\n`);
  try {
    execSync(testCommand, { stdio: 'inherit' }); // Inherit stdio to see live output
    console.log('\\nPlaywright tests completed successfully.');
  } catch (error) {
    console.error('\\nPlaywright tests failed.');
    playwrightPassed = false;

    // Don't exit yet, still check server logs
  }

  // 3. Scan the server log file for errors
  const serverErrors = scanLogForErrors(logFilePath);

  // 4. Determine final exit code
  if (serverErrors.length > 0) {
    console.error('\\n--------------------------------------------------');
    console.error('❌ ERROR: Server log errors detected during E2E run! ❌');
    console.error('--------------------------------------------------');
    serverErrors.forEach(errLine => console.error(errLine));
    console.error('\\n--------------------------------------------------\\n');
    process.exit(1); // Exit with error code if server errors found
  } else if (!playwrightPassed) {
    console.error('\\n--------------------------------------------------');
    console.error('❌ ERROR: Playwright tests failed (no server log errors detected). ❌');
    console.error('--------------------------------------------------\\n');
    process.exit(1); // Exit with error code if Playwright failed
  } else {
    console.log('\\n✅ E2E run completed successfully with no detected server log errors.');
    process.exit(0); // Success
  }
}

// Ensure logs directory exists
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

runE2ETests();
