#!/usr/bin/env node

const http = require('http');

const { getCurrentPort } = require('./get-port');

/**
 * Script to check the health of the Next.js server
 * using the dynamic port stored in .next-port
 */

async function checkHealth() {
  const port = getCurrentPort();

  if (!port) {
    console.error('❌ No port information found. Is the server running?');
    console.error('   Try running "npm run ai:port" to detect the port.');
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
      reject(new Error(`Failed to connect to server: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Health check request timed out'));
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
