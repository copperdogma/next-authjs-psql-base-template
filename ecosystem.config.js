const fs = require('fs');
const path = require('path');

function getPortFromNextPortFile() {
  try {
    const portFilePath = path.join(__dirname, '.next-port');
    if (fs.existsSync(portFilePath)) {
      const port = parseInt(fs.readFileSync(portFilePath, 'utf8').trim(), 10);
      if (!isNaN(port)) return port;
    }
  } catch (e) {
    // Silently handle error - log to file if needed
    const errorMsg = `[ecosystem.config.js] Error reading .next-port: ${e.message}`;

    // Optional: fs.appendFileSync('./logs/config-errors.log', errorMsg + '\n');
  }

  // Fallback to process.env.PORT from the environment PM2 is launched in, or 3000
  const envPort = parseInt(process.env.PORT, 10);

  return !isNaN(envPort) ? envPort : 3000;
}

const dynamicPort = getPortFromNextPortFile();

// Log port information without console.log
const portInfo = `[ecosystem.config.js] Determined port: ${dynamicPort}`;

// Optional: fs.appendFileSync('./logs/config-info.log', portInfo + '\n');

// Determine which script to run based on environment
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.argv.includes('--env=test');
const scriptArgs = isTestEnvironment ? 'run dev:test' : 'run dev:3001';

module.exports = {
  apps: [
    {
      name: 'next-dev',
      script: 'npm',
      args: scriptArgs,
      watch: ['.'],
      ignore_watch: ['node_modules', '.next', 'logs', '.git', '*.log'],
      autorestart: true,
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        NEXTAUTH_URL: 'http://localhost:3001',
      },
      env_test: {
        NODE_ENV: 'test',
        DATABASE_URL:
          'postgresql://postgres:postgres@localhost:5432/next_auth_psql_app_test?schema=public',
        NEXTAUTH_SECRET: 'test_nextauth_secret',
        PORT: 3777,
        NEXTAUTH_URL: 'http://localhost:3777',
        TEST_USER_EMAIL: 'test@example.com',
        TEST_USER_PASSWORD: 'Test123!',
        ALLOW_TEST_ENDPOINTS: 'true',
        NEXT_PUBLIC_IS_E2E_TEST_ENV: 'true',
        RATE_LIMIT_REGISTER_MAX_ATTEMPTS: '1000',
      },
      out_file: './logs/next-dev-out.log',
      error_file: './logs/next-dev-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
