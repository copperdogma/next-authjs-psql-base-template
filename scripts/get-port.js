#!/usr/bin/env node

/**
 * get-port.js
 *
 * Reads the port number from the .next/BUILD_ID file or PM2 logs
 * and saves it to a .next-port file for other scripts to use.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Constants
const PORT_FILE = path.join(__dirname, '..', '.next-port');
const DEFAULT_PORT = 3000;

// Try to get the port from PM2 logs
function getPortFromPm2Logs() {
  try {
    // Get the most recent logs from PM2
    const logs = execSync('pm2 logs next-dev --lines 50 --nostream').toString().split('\n');

    // Look for the line that contains the port information
    const portLine = logs.find(
      line => line.includes('- Local:') && line.includes('http://localhost:')
    );

    if (portLine) {
      const match = portLine.match(/http:\/\/localhost:(\d+)/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
  } catch (error) {
    console.error('Error getting port from PM2 logs:', error.message);
  }

  return null;
}

// Main function
function findAndSavePort() {
  let port = getPortFromPm2Logs();

  if (!port) {
    console.log(`Could not determine port from logs, using default port ${DEFAULT_PORT}`);
    port = DEFAULT_PORT;
  }

  // Save the port to a file
  fs.writeFileSync(PORT_FILE, port.toString());
  console.log(`✓ Port ${port} saved to ${PORT_FILE}`);

  return port;
}

// Execute and export
const port = findAndSavePort();
module.exports = port;
