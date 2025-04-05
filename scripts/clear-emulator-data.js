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

async function clearEmulatorData() {
  console.log('🧹 Clearing Firebase emulator data...');

  try {
    // Clear Firestore data
    console.log(`Clearing Firestore data at ${FIRESTORE_CLEAR_URL}...`);
    try {
      const firestoreResponse = await axios.delete(FIRESTORE_CLEAR_URL);
      console.log(`✅ Firestore data cleared. Status: ${firestoreResponse.status}`);
    } catch (error) {
      console.warn(`⚠️ Failed to clear Firestore data: ${error.message}`);
      console.warn('This is not critical if you are not using Firestore in your tests');
    }

    // Clear Auth data
    console.log(`Clearing Auth data at ${AUTH_CLEAR_URL}...`);
    try {
      const authResponse = await axios.delete(AUTH_CLEAR_URL);
      console.log(`✅ Auth data cleared. Status: ${authResponse.status}`);
    } catch (error) {
      console.warn(`⚠️ Failed to clear Auth data: ${error.message}`);
      console.warn('This may cause tests to fail if they depend on specific auth states');
    }

    console.log('✅ Emulator data clearing complete');
  } catch (error) {
    console.error(`❌ Error clearing emulator data: ${error.message}`);

    // Don't exit with error as the emulators might not be running yet
    // The main test script will handle this
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
