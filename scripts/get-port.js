#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * This script extracts the port number from the PM2 logs
 * and saves it to a file for use by other commands
 */

// Port information storage
const PORT_FILE = path.join(__dirname, '..', '.next-port');

// Wait for the server to start (adjust timeout as needed)
function extractPortFromLogs() {
  try {
    // Clear the existing port file to avoid using stale data
    if (fs.existsSync(PORT_FILE)) {
      fs.unlinkSync(PORT_FILE);
    }

    // Get the latest logs
    const logOutput = execSync('npm run ai:logs', { encoding: 'utf8' });

    // Look for the latest port announcement in the logs
    // Sort by most specific to less specific patterns
    const patterns = [
      /- Local:\s+http:\/\/localhost:(\d+)/, // PM2 output format
      /Local:\s+http:\/\/localhost:(\d+)/, // Standard next.js format
      /localhost:(\d+)/, // Fallback pattern
    ];

    for (const regex of patterns) {
      // Find all matches
      const matches = [...logOutput.matchAll(new RegExp(regex, 'g'))];

      // If we have matches, use the last one (most recent)
      if (matches.length > 0) {
        const port = matches[matches.length - 1][1];
        console.log(`✓ Server running on port: ${port}`);

        // Save the port to a file for other commands to use
        fs.writeFileSync(PORT_FILE, port);

        return port;
      }
    }

    // If we couldn't find the port yet, it might still be starting up
    console.log('Waiting for server to report port...');

    return null;
  } catch (error) {
    console.error('Error extracting port:', error.message);

    return null;
  }
}

// Try to get the port, with retries
function getPortWithRetry(maxRetries = 5, delay = 2000) {
  let retries = 0;

  const tryGetPort = () => {
    const port = extractPortFromLogs();

    if (port) {
      return port;
    } else if (retries < maxRetries) {
      retries++;
      console.log(`Retrying (${retries}/${maxRetries})...`);
      setTimeout(tryGetPort, delay);
    } else {
      console.error('Failed to detect port after maximum retries.');
      process.exit(1);
    }
  };

  return tryGetPort();
}

// Function to read the current port (if available)
function getCurrentPort() {
  try {
    if (fs.existsSync(PORT_FILE)) {
      return fs.readFileSync(PORT_FILE, 'utf8').trim();
    }
  } catch (err) {
    return null;
  }

  return null;
}

// If this script is called directly, try to extract the port
if (require.main === module) {
  const currentPort = getCurrentPort();

  if (currentPort) {
    console.log(`Found existing port: ${currentPort}`);
  } else {
    getPortWithRetry();
  }
}

module.exports = {
  getCurrentPort,
};
