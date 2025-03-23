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
      const response = await new Promise<Response>((resolve, reject) => {
        const req = http.get(url, res => {
          resolve(res as unknown as Response);
        });

        req.on('error', reject);
        req.end();
      });

      if ((response as any).statusCode === 200) {
        console.log(`Server is ready at ${url}`);
        return true;
      }
    } catch (error) {
      // Ignore errors, just try again
    }

    // Wait 1 second before trying again
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Waiting for server (attempt ${i + 1}/${maxAttempts})...`);
  }

  console.error(`Server did not become ready at ${url} after ${maxAttempts} attempts`);
  return false;
}

async function main() {
  try {
    // Find an available port
    const port = await findAvailablePort();
    console.log(`Found available port: ${port}`);

    // Start the dev server with the available port
    spawnSync('npm', ['run', 'dev', '--', '-p', port.toString()], {
      stdio: 'inherit',
      shell: true,
    });

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
    const result = spawnSync('npx', ['playwright', 'test', ...testArgs], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_TEST_BASE_URL: serverUrl,
      },
    });

    process.exit(result.status || 0);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

main().catch(console.error);
