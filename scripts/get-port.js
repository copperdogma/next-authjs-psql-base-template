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
    // Get the latest logs
    const logOutput = execSync('npm run ai:logs', { encoding: 'utf8' });

    // Look for the latest port announcement in the logs
    // Sort by most specific to less specific patterns
    const patterns = [
      /- Local:\s+http:\/\/localhost:(\d+)/g, // PM2 output format
      /Local:\s+http:\/\/localhost:(\d+)/g, // Standard next.js format
      /localhost:(\d+)/g, // Fallback pattern
    ];

    // Find all port announcements
    let extractedPorts = [];
    for (const regex of patterns) {
      const matches = [...logOutput.matchAll(regex)];
      if (matches.length > 0) {
        // Extract all port numbers
        const ports = matches.map(match => match[1]);
        extractedPorts = [...extractedPorts, ...ports];
      }
    }

    if (extractedPorts.length > 0) {
      // Use the most recent port (last in the logs)
      const port = extractedPorts[extractedPorts.length - 1];
      console.log(`✓ Server running on port: ${port}`);

      // Save the port to a file for other commands to use
      fs.writeFileSync(PORT_FILE, port);

      return port;
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
      const port = fs.readFileSync(PORT_FILE, 'utf8').trim();

      // Verify if the port is still valid by checking if the server is running on this port
      try {
        // Simple check to see if anything is running on this port
        execSync(`lsof -i :${port} -P -n -t`, { stdio: 'ignore' });

        return port;
      } catch (e) {
        // Port is not active, try to get the current port
        console.log('Port file exists but port is not active. Attempting to find current port...');

        return extractPortFromLogs();
      }
    }
  } catch (err) {
    console.error('Error reading port file:', err.message);

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
  extractPortFromLogs,
};
