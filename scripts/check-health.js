#!/usr/bin/env node

/**
 * check-health.js
 *
 * Checks the health of the Next.js server by making a request to the /api/health endpoint.
 * Reads the port from the .next-port file created by get-port.js.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

// Constants
const PORT_FILE = path.join(__dirname, '..', '.next-port');
const DEFAULT_PORT = 3000;
const HEALTH_ENDPOINT = '/api/health';

// Get the port from the .next-port file
function getPort() {
  try {
    if (fs.existsSync(PORT_FILE)) {
      const port = parseInt(fs.readFileSync(PORT_FILE, 'utf8').trim(), 10);

      return port;
    }
  } catch (error) {
    console.error('Error reading port file:', error.message);
  }

  console.log(`⚠️ Port file not found, using default port ${DEFAULT_PORT}`);

  return DEFAULT_PORT;
}

// Check the health endpoint
function checkHealth(port) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: HEALTH_ENDPOINT,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ statusCode: res.statusCode, response });
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}

// Main function
async function main() {
  const port = getPort();
  console.log(`Checking health endpoint on port ${port}...`);

  try {
    const { statusCode, response } = await checkHealth(port);

    if (statusCode === 200 && response.status === 'ok') {
      console.log('✅ Server is healthy');
      console.log(JSON.stringify(response, null, 2));
      process.exit(0);
    } else {
      console.error(`❌ Server health check failed: HTTP ${statusCode}`);
      console.error(JSON.stringify(response, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error checking server health: ${error.message}`);
    process.exit(1);
  }
}

// Execute
main();
