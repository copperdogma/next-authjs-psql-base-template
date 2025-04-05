#!/usr/bin/env node

/**
 * verify-port.js
 *
 * Checks if the .next-port file exists and reads its contents.
 */

const fs = require('fs');
const path = require('path');

const portFile = path.join(__dirname, '..', '.next-port');

if (fs.existsSync(portFile)) {
  const port = fs.readFileSync(portFile, 'utf8').trim();
  console.log(`✓ Port file exists: ${port}`);
} else {
  console.error('❌ Port file missing');
  process.exit(1);
}
