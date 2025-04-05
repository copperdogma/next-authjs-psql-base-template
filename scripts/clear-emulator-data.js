#!/usr/bin/env node

/**
 * Script to clear all data from Firebase emulators
 * Used before running E2E tests to ensure a clean state
 */

const path = require('path');

const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Firebase project ID from environment or default
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'next-firebase-base-template';

// Emulator endpoints for clearing data
const FIRESTORE_CLEAR_URL = `http://localhost:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH_CLEAR_URL = `http://localhost:9099/emulator/v1/projects/${PROJECT_ID}/accounts`;

// Helper function to clear a specific emulator service
async function clearEmulatorService(name, url) {
  console.log(`Clearing ${name} data at ${url}...`);
  try {
    const response = await axios.delete(url);
    console.log(`✅ ${name} data cleared. Status: ${response.status}`);
  } catch (error) {
    console.warn(`⚠️ Failed to clear ${name} data: ${error.message}`);
    console.warn(
      name === 'Firestore'
        ? 'This is not critical if you are not using Firestore in your tests'
        : 'This may cause tests to fail if they depend on specific auth states'
    );
  }
}

async function clearEmulatorData() {
  console.log('🧹 Clearing Firebase emulator data...');

  try {
    // Clear individual services
    await clearEmulatorService('Firestore', FIRESTORE_CLEAR_URL);
    await clearEmulatorService('Auth', AUTH_CLEAR_URL);

    console.log('✅ Emulator data clearing complete');
  } catch (error) {
    console.error(`❌ Error clearing emulator data: ${error.message}`);

    // Don't exit with error as the emulators might not be running yet
  }
}

// Run the clear function
clearEmulatorData()
  .then(() => {
    console.log('✅ Emulator data clearing process completed');
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);

    // Don't exit with error as the emulators might not be running yet
  });
