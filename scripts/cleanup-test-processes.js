#!/usr/bin/env node

/**
 * cleanup-test-processes.js
 *
 * This script ensures all test-related processes are properly terminated
 * to prevent port conflicts and orphaned processes between test runs.
 *
 * It handles:
 * - Next.js development server (port 3777)
 * - Firebase emulators (ports 8080, 9099, 9150, etc.)
 * - Any hanging Playwright browser instances
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORTS_TO_KILL = [3777, 8080, 9000, 9099, 9150, 9229];
const PM2_PROCESS_NAME = 'next-dev';
const PM2_PORT_FILE = path.join(__dirname, '..', '.next-port');

console.log('🧹 Cleaning up test processes...');

// Function to check if a command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });

    return true;
  } catch (error) {
    return false;
  }
}

// Kill processes by port
function killProcessesByPort() {
  console.log('🔍 Checking for processes on test ports...');

  for (const port of PORTS_TO_KILL) {
    try {
      // Check if a process is using this port
      const lsofOutput = execSync(`lsof -i:${port} -t`, { stdio: 'pipe' }).toString().trim();

      if (lsofOutput) {
        console.log(`🔴 Found process using port ${port}, terminating...`);
        execSync(`kill -9 ${lsofOutput}`, { stdio: 'ignore' });
        console.log(`✅ Terminated process on port ${port}`);
      }
    } catch (error) {
      // No process found on this port - that's fine
    }
  }
}

// Stop PM2 processes if running
function stopPM2Processes() {
  if (commandExists('pm2')) {
    try {
      console.log('🔍 Checking for PM2 processes...');
      execSync('pm2 ping', { stdio: 'ignore' });

      // Stop the next-dev process if it exists
      try {
        execSync(`pm2 stop ${PM2_PROCESS_NAME}`, { stdio: 'ignore' });
        console.log(`✅ Stopped PM2 process: ${PM2_PROCESS_NAME}`);
      } catch (error) {
        // Process might not exist - that's okay
      }

      // Remove the port file if it exists
      if (fs.existsSync(PM2_PORT_FILE)) {
        fs.unlinkSync(PM2_PORT_FILE);
        console.log('✅ Removed PM2 port file');
      }
    } catch (error) {
      // PM2 is not running - that's fine
    }
  }
}

// Kill any hanging Playwright browser instances
function killPlaywrightProcesses() {
  if (process.platform !== 'win32') {
    try {
      console.log('🔍 Checking for hanging Playwright browser processes...');
      execSync('pkill -f playwright', { stdio: 'ignore' });
      console.log('✅ Terminated any hanging Playwright processes');
    } catch (error) {
      // No processes found - that's fine
    }
  }
}

// Kill Firebase emulator processes
function killFirebaseEmulators() {
  try {
    console.log('🔍 Checking for Firebase emulator processes...');
    if (process.platform === 'win32') {
      execSync('taskkill /f /im java.exe', { stdio: 'ignore' });
    } else {
      const javaProcesses = execSync('ps aux | grep "[j]ava.*emulator" | awk \'{print $2}\'', {
        stdio: 'pipe',
      })
        .toString()
        .trim();
      if (javaProcesses) {
        execSync(`kill -9 ${javaProcesses}`, { stdio: 'ignore' });
      }
    }
    console.log('✅ Terminated any Firebase emulator processes');
  } catch (error) {
    // No processes found - that's fine
  }
}

// Run cleanup functions
try {
  killProcessesByPort();
  stopPM2Processes();
  killPlaywrightProcesses();
  killFirebaseEmulators();
  console.log('✨ All test processes cleaned up successfully!');
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}
