#!/usr/bin/env node

const http = require('http');

const { getCurrentPort, extractPortFromLogs } = require('./get-port');

/**
 * Script to check the health of the Next.js server
 * using the dynamic port stored in .next-port
 */

async function checkHealth(retryCount = 0, maxRetries = 3) {
  const port = getCurrentPort();

  if (!port) {
    if (retryCount < maxRetries) {
      console.log(
        `No port information found. Attempting to detect port (attempt ${retryCount + 1}/${maxRetries})...`
      );
      const detectedPort = extractPortFromLogs();
      if (detectedPort) {
        return checkHealth(0, maxRetries); // Reset retry counter if we found a port
      } else {
        return checkHealth(retryCount + 1, maxRetries);
      }
    }

    console.error('❌ No port information found after multiple attempts. Is the server running?');
    console.error('   Try running "npm run ai:start" to restart the server.');
    process.exit(1);
  }

  const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/health',
    method: 'GET',
    timeout: 5000,
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`Health check failed with status: ${res.statusCode}`));

        return;
      }

      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const healthInfo = JSON.parse(data);
          resolve(healthInfo);
        } catch (error) {
          reject(new Error(`Failed to parse health check response: ${error.message}`));
        }
      });
    });

    req.on('error', error => {
      // If connection refused and we haven't exceeded retries, try to get a new port
      if (
        (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') &&
        retryCount < maxRetries
      ) {
        console.log(
          `Connection failed. Attempting to detect new port (attempt ${retryCount + 1}/${maxRetries})...`
        );
        extractPortFromLogs();
        setTimeout(() => {
          resolve(checkHealth(retryCount + 1, maxRetries));
        }, 2000);
      } else {
        reject(new Error(`Failed to connect to server: ${error.message}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (retryCount < maxRetries) {
        console.log(`Request timed out. Retrying (attempt ${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => {
          resolve(checkHealth(retryCount + 1, maxRetries));
        }, 2000);
      } else {
        reject(new Error('Health check request timed out after multiple attempts'));
      }
    });

    req.end();
  });
}

// If the script is called directly, run the health check
if (require.main === module) {
  checkHealth()
    .then(health => {
      console.log(`✓ Server is healthy on port ${getCurrentPort()}`);
      console.log('Health information:', health);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ Health check failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  checkHealth,
};
