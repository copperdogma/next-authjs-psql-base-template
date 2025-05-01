#!/usr/bin/env node

/**
 * Script to create/update Firebase seed data for E2E tests
 *
 * This script:
 * 1. Starts the Firebase emulators
 * 2. Creates test user(s) and any other necessary data
 * 3. Exports the emulator state to the firebase-seed-data directory
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Directory to export data to
const SEED_DATA_DIR = path.join(__dirname, '../firebase-seed-data');

console.log('🌱 Updating Firebase seed data for E2E tests...');

// Step 1: Ensure the seed data directory exists
console.log(`Ensuring seed data directory exists: ${SEED_DATA_DIR}`);
if (!fs.existsSync(SEED_DATA_DIR)) {
  fs.mkdirSync(SEED_DATA_DIR, { recursive: true });
  console.log('Created seed data directory');
} else {
  console.log('Seed data directory already exists');
}

try {
  // Step 2: Start emulators in the background
  console.log('Starting Firebase emulators...');
  const emulatorProcess = require('child_process').spawn(
    'npx',
    [
      'firebase',
      'emulators:start',
      '--only',
      'auth,firestore',
      '--project',
      'next-firebase-base-template',
    ],
    { detached: true, stdio: 'ignore' }
  );

  // Don't wait for emulator process to exit
  emulatorProcess.unref();

  // Wait for emulators to be ready
  console.log('Waiting for emulators to start (10 seconds)...');
  setTimeout(() => {
    try {
      // Step 3: Set up test user
      console.log('Creating test user...');
      execSync('node scripts/create-test-user.js', { stdio: 'inherit' });

      // Step 4: Export emulator data (kills emulators)
      console.log('Exporting emulator data...');
      execSync(
        'npx firebase emulators:export ./firebase-seed-data --force --project next-firebase-base-template',
        { stdio: 'inherit' }
      );

      console.log('✅ Seed data updated successfully!');
      console.log(`Data saved to: ${SEED_DATA_DIR}`);

      // Kill the emulator process if it's still running
      try {
        process.kill(-emulatorProcess.pid);
      } catch (killError) {
        // Ignore kill errors, emulators might have already exited
      }

      process.exit(0);
    } catch (error) {
      console.error('❌ Error during seed data creation:', error.message);

      // Kill the emulator process if it's still running
      try {
        process.kill(-emulatorProcess.pid);
      } catch (killError) {
        // Ignore kill errors, emulators might have already exited
      }

      process.exit(1);
    }
  }, 10000);
} catch (error) {
  console.error('❌ Error starting emulators:', error.message);
  process.exit(1);
}
