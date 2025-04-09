#!/usr/bin/env node

/**
 * get-port.js
 *
 * Uses the fixed port 3001 for AI server management.
 */

const fs = require('fs');
const path = require('path');

// Constants
const PORT_FILE = path.join(__dirname, '..', '.next-port');
const FIXED_PORT = 3001;

// Main function
function saveFixedPort() {
  // Save the port to a file
  fs.writeFileSync(PORT_FILE, FIXED_PORT.toString());
  console.log(`✓ Port ${FIXED_PORT} saved to ${PORT_FILE}`);

  return FIXED_PORT;
}

// Execute and export
const port = saveFixedPort();
module.exports = port;
