#!/usr/bin/env node
import { spawnSync } from 'child_process';
import * as net from 'net';
import * as http from 'http';

/**
 * Find an available port for the dev server
 */
async function findAvailablePort(startingPort: number = 3000): Promise<number> {
  const server = net.createServer();

  return new Promise((resolve, reject) => {
    let port = startingPort;
    const maxAttempts = 10;
    let attempts = 0;

    function tryPort() {
      if (attempts >= maxAttempts) {
        reject(new Error(`Could not find an available port after ${maxAttempts} attempts`));
        return;
      }

      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          port++;
          attempts++;
          tryPort();
        } else {
          reject(err);
        }
      });

      server.once('listening', () => {
        server.close(() => {
          resolve(port);
        });
      });

      server.listen(port);
    }

    tryPort();
  });
}

async function checkServerReadiness(url: string, maxAttempts: number = 30): Promise<boolean> {
  console.log(`Checking if server is ready at ${url}...`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.get(url, resolve);
        req.on('error', reject);
        req.end();
      });

      if ((response as http.IncomingMessage).statusCode === 200) {
        console.log(`Server is ready at ${url}`);
        return true;
      }
    } catch (error) {
      // More detailed error handling
      if (i === maxAttempts - 1) {
        console.error(
          `Failed to connect to server: ${error instanceof Error ? error.message : String(error)}`
        );
      } else {
        console.log(
          `Connection attempt failed (${i + 1}/${maxAttempts}): ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Wait 1 second before trying again
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Waiting for server (attempt ${i + 1}/${maxAttempts})...`);
  }

  console.error(`Server did not become ready at ${url} after ${maxAttempts} attempts`);
  return false;
}

async function runCommand(
  command: string,
  args: string[],
  options: Record<string, unknown> = {}
): Promise<number> {
  try {
    const result = spawnSync(command, args, {
      stdio: 'inherit',
      ...options,
    });

    if (result.error) {
      console.error(`Failed to execute command: ${result.error.message}`);
      return 1;
    }

    return result.status || 0;
  } catch (error) {
    console.error(
      `Exception running command: ${error instanceof Error ? error.message : String(error)}`
    );
    return 1;
  }
}

async function main() {
  try {
    // Find an available port
    const port = await findAvailablePort();
    console.log(`Found available port: ${port}`);

    // Start the dev server with the available port
    const devServerResult = await runCommand('npm', ['run', 'dev', '--', '-p', port.toString()], {
      shell: true,
    });

    if (devServerResult !== 0) {
      console.error(`Failed to start dev server. Exiting with code ${devServerResult}`);
      process.exit(devServerResult);
    }

    // Wait for the server to be ready
    const serverUrl = `http://localhost:${port}`;
    const isServerReady = await checkServerReadiness(serverUrl);

    if (!isServerReady) {
      console.error('Server did not start properly. Exiting...');
      process.exit(1);
    }

    // Set environment variables for Playwright
    process.env.PLAYWRIGHT_TEST_BASE_URL = serverUrl;

    // Run the tests
    const testArgs = process.argv.slice(2);
    const testResult = await runCommand('npx', ['playwright', 'test', ...testArgs], {
      env: {
        ...process.env,
        PLAYWRIGHT_TEST_BASE_URL: serverUrl,
      },
    });

    process.exit(testResult);
  } catch (error) {
    console.error('Error running tests:', error instanceof Error ? error.stack : String(error));
    process.exit(1);
  }
}

// Add proper signal handling for cleaner shutdowns
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(error => {
  console.error('Fatal error:', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
