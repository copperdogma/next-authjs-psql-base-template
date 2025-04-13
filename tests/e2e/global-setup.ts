import { exec } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
// Firebase v9+ modular imports - Use @firebase/ scoped packages
import { initializeApp } from '@firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  updateProfile,
  AuthErrorCodes,
} from '@firebase/auth';

// Load .env.test for emulator hosts and test user credentials
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Configuration constants
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123!';
const TEST_USER_DISPLAY_NAME = process.env.TEST_USER_DISPLAY_NAME || 'Test User';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'next-firebase-base-template';
const AUTH_EMULATOR_HOST = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const FIRESTORE_EMULATOR_HOST = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost:8080';

const AUTH_EMULATOR_URL = `http://${AUTH_EMULATOR_HOST}`;
const FIRESTORE_EMULATOR_URL = `http://${FIRESTORE_EMULATOR_HOST}`;
const AUTH_CLEAR_URL = `${AUTH_EMULATOR_URL}/emulator/v1/projects/${FIREBASE_PROJECT_ID}/accounts`;
const FIRESTORE_CLEAR_URL = `${FIRESTORE_EMULATOR_URL}/emulator/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// Firebase config for SDK client (uses fake key as it's for emulator)
const firebaseClientConfig = {
  apiKey: 'fake-api-key',
  authDomain: AUTH_EMULATOR_HOST, // Use emulator host
  projectId: FIREBASE_PROJECT_ID,
};

// Utility to wait for a port to be open
function waitForPort(port: number, host: string, timeout = 60000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const socket = require('net').createConnection(port, host);
      socket.on('connect', () => {
        socket.end();
        console.log(`✅ Port ${host}:${port} is open.`);
        resolve();
      });
      socket.on('error', (err: NodeJS.ErrnoException) => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for port ${host}:${port}: ${err.message}`));
        } else {
          console.log(`⏳ Waiting for port ${host}:${port}... (${err.code})`);
          setTimeout(check, 1000);
        }
      });
    };
    check();
  });
}

// Clear emulator data
async function clearEmulatorData() {
  console.log('🧹 Clearing Firebase emulator data...');
  try {
    await axios.delete(AUTH_CLEAR_URL);
    console.log('✅ Auth emulator data cleared.');
  } catch (error: any) {
    console.warn(`⚠️ Could not clear Auth emulator: ${error.message}`);
  }
  try {
    await axios.delete(FIRESTORE_CLEAR_URL);
    console.log('✅ Firestore emulator data cleared.');
  } catch (error: any) {
    console.warn(`⚠️ Could not clear Firestore emulator: ${error.message}`);
  }
}

// Create or verify test user
async function setupTestUser() {
  console.log(`👤 Setting up test user: ${TEST_USER_EMAIL}...`);
  const app = initializeApp(firebaseClientConfig);
  const auth = getAuth(app);
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      TEST_USER_EMAIL,
      TEST_USER_PASSWORD
    );
    await updateProfile(userCredential.user, {
      displayName: TEST_USER_DISPLAY_NAME,
    });
    console.log(`✅ Test user created successfully: ${userCredential.user.uid}`);
  } catch (error: any) {
    if (error.code === AuthErrorCodes.EMAIL_EXISTS) {
      console.log('ℹ️ Test user already exists. Verifying...');
      try {
        await signInWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
        console.log('✅ Existing test user verified.');
      } catch (signInError: any) {
        console.error(`❌ Failed to verify existing user: ${signInError.message}`);
        throw signInError;
      }
    } else {
      console.error(`❌ Failed to create test user: ${error.message}`);
      throw error;
    }
  }
}

// Global setup function
async function globalSetup() {
  console.log('--- E2E Global Setup ---');

  try {
    await clearEmulatorData();

    console.log('🔥 Starting Firebase emulators...');
    const emulatorProcess = exec('npm run firebase:emulators:import', (error, _, stderr) => {
      if (error) {
        console.error(`Emulator Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Emulator Stderr: ${stderr}`);
      }
    });

    emulatorProcess.stdout?.pipe(process.stdout);
    emulatorProcess.stderr?.pipe(process.stderr);

    console.log('⏳ Waiting for emulators to be ready...');
    const authPort = parseInt(AUTH_EMULATOR_HOST.split(':')[1]);
    const firestorePort = parseInt(FIRESTORE_EMULATOR_HOST.split(':')[1]);
    const authHost = AUTH_EMULATOR_HOST.split(':')[0];
    const firestoreHost = FIRESTORE_EMULATOR_HOST.split(':')[0];

    await Promise.all([
      waitForPort(authPort, authHost, 90000),
      waitForPort(firestorePort, firestoreHost, 90000),
    ]);
    console.log('✅ Firebase Emulators are ready.');

    // Add a brief delay to ensure services are fully initialized
    console.log('⏳ Short delay for service initialization...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay

    await setupTestUser();

    console.log('--- E2E Global Setup Complete ---');
  } catch (error: any) {
    console.error('❌ E2E GLOBAL SETUP FAILED:');
    console.error(error.message);
    process.exit(1);
  }
}

export default globalSetup;

// Cleanup function can be added here if needed (e.g., stopping emulators)
// async function globalTeardown() {
//   console.log('--- E2E Global Teardown ---');
//   // Add cleanup logic here, e.g., stop emulator process if started directly
// }
