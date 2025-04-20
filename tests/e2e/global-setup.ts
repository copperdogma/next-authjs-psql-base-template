console.log('--- Loading tests/e2e/global-setup.ts ---'); // Add top-level log

import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios'; // Restore axios import
import * as admin from 'firebase-admin'; // Import Firebase Admin SDK
import fs from 'fs/promises'; // Use promises version of fs
import { PrismaClient } from '@prisma/client'; // Import Prisma Client

// Load .env.test for emulator hosts and test user credentials
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// --- Prisma Client Initialization ---
const prisma = new PrismaClient();
// --- End Prisma Client Initialization ---

// --- Admin SDK Initialization ---
// Explicitly initialize Admin SDK here for global setup tasks
// Use the correct project ID for the emulators
const projectIdForEmulator = process.env.FIREBASE_PROJECT_ID || 'next-firebase-base-template';

// Ensure emulator hosts are set for this process
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
}
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost:8080';
}

let adminApp: admin.app.App;
try {
  console.log(
    `[globalSetup] Initializing Firebase Admin SDK for project: ${projectIdForEmulator}...`
  );
  adminApp = admin.initializeApp({
    projectId: projectIdForEmulator,
    // No credentials needed when emulator host env vars are set
  });
  console.log('✅ Firebase Admin SDK initialized.');
  console.timeLog('[globalSetup:adminInit]'); // Log time after successful init
} catch (error: any) {
  // Check if it's because it's already initialized (common in some setups)
  if (error.code === 'app/duplicate-app') {
    console.log('🔸 [globalSetup] Firebase Admin SDK already initialized, getting default app.');
    adminApp = admin.app(); // Get the default app
  } else {
    console.error('❌ [globalSetup] Failed to initialize Firebase Admin SDK:', error);
    throw error; // Propagate other errors
  }
}
const adminAuth = adminApp.auth(); // Get auth instance from the app
// --- End Admin SDK Initialization ---

// Configuration constants
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123!'; // Restore
const TEST_USER_DISPLAY_NAME = process.env.TEST_USER_DISPLAY_NAME || 'Test User'; // Restore
const AUTH_EMULATOR_HOST = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'; // Restore
const FIRESTORE_EMULATOR_HOST = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || 'localhost:8080'; // Restore
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS; // Get path from env

const AUTH_EMULATOR_URL = `http://${AUTH_EMULATOR_HOST}`; // Restore
const FIRESTORE_EMULATOR_URL = `http://${FIRESTORE_EMULATOR_HOST}`; // Restore

// Path for saving the user UID
const USER_UID_PATH = path.resolve(__dirname, '../.auth/user-uid.txt'); // <<< CHANGED PATH
// Path for saving the custom token
const CUSTOM_TOKEN_PATH = path.resolve(__dirname, '../.auth/custom-token.txt'); // <<< ADDED PATH

// Utility to wait for a port to be open
/*
function waitForPort(port: number, host: string, timeout = 60000): Promise<void> {
  console.log(`[waitForPort] Starting check for ${host}:${port}`);
  console.time(`[waitForPort] ${host}:${port}`); // Start timer for this port
// ... (rest of waitForPort function) ...
    check();
  });
}
*/
function waitForPort(port: number, host: string, timeout = 90000): Promise<void> {
  console.log(`[waitForPort] Starting check for ${host}:${port}`);
  console.time(`[waitForPort] ${host}:${port}`); // Start timer for this port
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const socket = require('net').createConnection(port, host);
      socket.on('connect', () => {
        socket.end();
        console.log(`✅ [waitForPort] Port ${host}:${port} is open.`);
        console.timeEnd(`[waitForPort] ${host}:${port}`); // End timer
        resolve();
      });
      socket.on('error', (err: NodeJS.ErrnoException) => {
        if (Date.now() - startTime > timeout) {
          console.error(`❌ [waitForPort] Timeout waiting for port ${host}:${port}`);
          console.timeEnd(`[waitForPort] ${host}:${port}`); // End timer on error
          reject(new Error(`Timeout waiting for port ${host}:${port}: ${err.message}`));
        } else {
          console.log(`⏳ [waitForPort] Waiting for port ${host}:${port}... (${err.code})`);
          setTimeout(check, 1000);
        }
      });
    };
    check();
  });
}

// --- Helper Functions for clearTestData ---

async function _clearPrismaData() {
  try {
    console.log('[clearTestData:_clearPrismaData] Clearing Prisma Session data...');
    const sessionCount = await prisma.session.deleteMany({});
    console.log(`[clearTestData:_clearPrismaData] Cleared ${sessionCount.count} sessions.`);

    console.log('[clearTestData:_clearPrismaData] Clearing Prisma Account data...');
    const accountCount = await prisma.account.deleteMany({});
    console.log(`[clearTestData:_clearPrismaData] Cleared ${accountCount.count} accounts.`);

    console.log('[clearTestData:_clearPrismaData] Clearing Prisma User data...');
    const userCount = await prisma.user.deleteMany({});
    console.log(`[clearTestData:_clearPrismaData] Cleared ${userCount.count} users.`);

    console.log(
      '✅ [clearTestData:_clearPrismaData] Prisma data cleared (User, Account, Session).'
    );
  } catch (error) {
    console.warn(`⚠️ [clearTestData:_clearPrismaData] Could not clear Prisma data: ${error}`);
  }
}

async function _clearAuthEmulatorData() {
  try {
    const clearAuthUrl = `${AUTH_EMULATOR_URL}/emulator/v1/projects/${projectIdForEmulator}/accounts`;
    console.log(`[clearTestData:_clearAuthEmulatorData] Attempting DELETE ${clearAuthUrl}`);
    await axios.delete(clearAuthUrl);
    console.log('✅ [clearTestData:_clearAuthEmulatorData] Auth emulator data cleared.');
  } catch (error: any) {
    console.warn(
      `⚠️ [clearTestData:_clearAuthEmulatorData] Could not clear Auth emulator (project: ${projectIdForEmulator}): ${error.message}`
    );
    if (error.response) {
      console.warn(
        `   Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`
      );
    }
  }
}

async function _clearFirestoreEmulatorData() {
  try {
    const clearFirestoreUrl = `${FIRESTORE_EMULATOR_URL}/emulator/v1/projects/${projectIdForEmulator}/databases/(default)/documents`;
    console.log(
      `[clearTestData:_clearFirestoreEmulatorData] Attempting DELETE ${clearFirestoreUrl}`
    );
    await axios.delete(clearFirestoreUrl);
    console.log('✅ [clearTestData:_clearFirestoreEmulatorData] Firestore emulator data cleared.');
  } catch (error: any) {
    console.warn(
      `⚠️ [clearTestData:_clearFirestoreEmulatorData] Could not clear Firestore emulator (project: ${projectIdForEmulator}): ${error.message}`
    );
    if (error.response) {
      console.warn(
        `   Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`
      );
    }
  }
}
// --- End Helper Functions for clearTestData ---

// Clear emulator data AND Prisma data
async function clearTestData() {
  console.log('🧹 Clearing Firebase emulator data AND Prisma test data...');
  const timerLabel = '[clearTestData]';
  console.time(timerLabel);

  // Use helper functions
  await _clearPrismaData();
  await _clearAuthEmulatorData();
  await _clearFirestoreEmulatorData();

  console.timeEnd(timerLabel); // End timer
}

// --- Helper Functions for setupUserAndSaveUid ---

/**
 * Ensures the test user exists in Firebase Auth, creating or updating as needed.
 * @param auth - Firebase Admin Auth instance.
 * @returns The UserRecord of the test user.
 * @throws Error if Firebase Auth operations fail.
 */
async function _ensureFirebaseAuthUser(auth: admin.auth.Auth): Promise<admin.auth.UserRecord> {
  console.log(
    '[setupUserAndSaveUid:_ensureFirebaseAuthUser] Checking/Creating Firebase Auth user...'
  );
  try {
    const userRecord = await auth.getUserByEmail(TEST_USER_EMAIL);
    console.log(
      `ℹ️ [setupUserAndSaveUid:_ensureFirebaseAuthUser] User found: ${userRecord.uid}. Updating...`
    );
    await auth.updateUser(userRecord.uid, { displayName: TEST_USER_DISPLAY_NAME });
    console.log(`✅ [setupUserAndSaveUid:_ensureFirebaseAuthUser] Existing user updated.`);
    return userRecord;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log('ℹ️ [setupUserAndSaveUid:_ensureFirebaseAuthUser] User not found, creating...');
      try {
        const newUserRecord = await auth.createUser({
          email: TEST_USER_EMAIL,
          emailVerified: true,
          password: TEST_USER_PASSWORD,
          displayName: TEST_USER_DISPLAY_NAME,
        });
        console.log(
          `✅ [setupUserAndSaveUid:_ensureFirebaseAuthUser] New user created: ${newUserRecord.uid}`
        );
        return newUserRecord;
      } catch (createError) {
        console.error(
          `❌ [setupUserAndSaveUid:_ensureFirebaseAuthUser] Failed to create user: ${createError}`
        );
        throw createError;
      }
    } else {
      console.error(
        `❌ [setupUserAndSaveUid:_ensureFirebaseAuthUser] Failed to get/update user: ${error.message}`
      );
      throw error;
    }
  }
}

/**
 * Upserts the user data into the Prisma database.
 * @param userRecord - The Firebase UserRecord.
 * @throws Error if Prisma operation fails.
 */
async function _upsertPrismaUser(userRecord: admin.auth.UserRecord): Promise<void> {
  console.log(
    `[setupUserAndSaveUid:_upsertPrismaUser] Upserting Prisma user for UID: ${userRecord.uid}...`
  );
  try {
    await prisma.user.upsert({
      where: { id: userRecord.uid },
      update: {
        name: userRecord.displayName,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified ? new Date() : null,
        image: userRecord.photoURL,
      },
      create: {
        id: userRecord.uid,
        name: userRecord.displayName,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified ? new Date() : null,
        image: userRecord.photoURL,
      },
    });
    console.log(`✅ [setupUserAndSaveUid:_upsertPrismaUser] Prisma user upserted successfully.`);
  } catch (prismaError) {
    console.error(
      `❌ [setupUserAndSaveUid:_upsertPrismaUser] Failed to upsert Prisma user: ${prismaError}`
    );
    throw prismaError;
  }
}

/**
 * Generates a custom token for the user and saves it to a file.
 * @param auth - Firebase Admin Auth instance.
 * @param uid - The user's UID.
 * @throws Error if token generation or file writing fails.
 */
async function _generateAndSaveCustomToken(auth: admin.auth.Auth, uid: string): Promise<void> {
  console.log(
    `[setupUserAndSaveUid:_generateAndSaveCustomToken] Generating/Saving custom token for UID: ${uid}...`
  );
  try {
    const customToken = await auth.createCustomToken(uid);
    await fs.writeFile(CUSTOM_TOKEN_PATH, customToken);
    console.log(
      `✅ [setupUserAndSaveUid:_generateAndSaveCustomToken] Custom token saved to ${CUSTOM_TOKEN_PATH}`
    );
  } catch (tokenError) {
    console.error(`❌ [setupUserAndSaveUid:_generateAndSaveCustomToken] Failed: ${tokenError}`);
    throw tokenError;
  }
}

/**
 * Saves the user's UID to a file.
 * @param uid - The user's UID.
 * @throws Error if file writing fails.
 */
async function _saveUserUid(uid: string): Promise<void> {
  console.log(`[setupUserAndSaveUid:_saveUserUid] Saving UID: ${uid}...`);
  try {
    await fs.writeFile(USER_UID_PATH, uid);
    console.log(`💾 [setupUserAndSaveUid:_saveUserUid] User UID saved to ${USER_UID_PATH}`);
  } catch (error) {
    console.error(`❌ [setupUserAndSaveUid:_saveUserUid] Failed to save UID: ${error}`);
    throw error;
  }
}
// --- End Helper Functions for setupUserAndSaveUid ---

// Modified function to setup user and save UID/token, AND create Prisma user
async function setupUserAndSaveUid(auth: admin.auth.Auth): Promise<string> {
  console.log(`👤 Setting up test user via Admin SDK: ${TEST_USER_EMAIL}...`);
  const timerLabel = '[setupUserAndSaveUid]';
  console.time(timerLabel);

  try {
    // 1. Ensure Firebase Auth User exists/is updated
    const userRecord = await _ensureFirebaseAuthUser(auth);
    const uid = userRecord.uid;

    // 2. Upsert user in Prisma
    await _upsertPrismaUser(userRecord);

    // 3. Generate and Save Custom Token
    await _generateAndSaveCustomToken(auth, uid);

    // 4. Save UID
    await _saveUserUid(uid);

    console.timeEnd(timerLabel); // End timer on success
    return uid;
  } catch (error) {
    console.error(`❌ [setupUserAndSaveUid] Setup failed overall: ${error}`);
    console.timeEnd(timerLabel); // End timer on error
    // Ensure setup fails if any step errors out
    throw new Error(`User setup failed: ${error instanceof Error ? error.message : error}`);
  }
}

function logConfigDetails() {
  console.log('🔧 Configuration Details:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  TEST_USER_EMAIL: ${TEST_USER_EMAIL}`);
  console.log(`  FIREBASE_PROJECT_ID: ${projectIdForEmulator}`);
  console.log(
    `  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`
  );
  console.log(
    `  NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: ${process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST}`
  );
  console.log(
    `  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: ${process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR}`
  );
  console.log(`  PLAYWRIGHT_TEST_BASE_URL: ${process.env.PLAYWRIGHT_TEST_BASE_URL}`);
  console.log(`  ALLOW_TEST_ENDPOINTS: ${process.env.ALLOW_TEST_ENDPOINTS}`);
  console.log(
    `  GOOGLE_APPLICATION_CREDENTIALS: ${SERVICE_ACCOUNT_PATH ? 'Set' : 'Not Set (Required!)'}`
  ); // Check if SA path is set
}

// async function startAndWaitForEmulators() {
/*
async function startAndWaitForEmulators() {
  // Keep port waiting logic
  console.log('⏳ Waiting for emulators to be ready (started via firebase emulators:exec)...');
// ... (rest of startAndWaitForEmulators function) ...
  console.timeEnd('[startAndWaitForEmulators]'); // End timer
}
*/
async function startAndWaitForEmulators() {
  // Keep port waiting logic
  console.log('⏳ Waiting for emulators to be ready (started via firebase emulators:exec)...');
  console.time('[startAndWaitForEmulators]'); // Start timer
  const authPort = parseInt(AUTH_EMULATOR_HOST.split(':')[1]);
  const firestorePort = parseInt(FIRESTORE_EMULATOR_HOST.split(':')[1]);
  const authHost = AUTH_EMULATOR_HOST.split(':')[0];
  const firestoreHost = FIRESTORE_EMULATOR_HOST.split(':')[0];

  try {
    await Promise.all([
      waitForPort(authPort, authHost, 90000), // Increased timeout
      waitForPort(firestorePort, firestoreHost, 90000), // Increased timeout
    ]);
    console.log('✅ Firebase Emulators appear to be ready.');
    // Add a brief delay to ensure services are fully initialized
    console.log('⏳ Short delay for service initialization...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Increased delay
  } catch (error) {
    console.error('❌ Error waiting for emulators:', error);
    console.timeEnd('[startAndWaitForEmulators]'); // End timer on error
    throw error; // Re-throw to fail setup if emulators aren't ready
  }
  console.timeEnd('[startAndWaitForEmulators]'); // End timer
}

// Modified global setup function
async function globalSetup() {
  console.log('--- E2E Global Setup --- START ---');
  console.time('[globalSetup]'); // Start overall timer

  logConfigDetails(); // Log config first

  // Check for GOOGLE_APPLICATION_CREDENTIALS early
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('❌ FATAL: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
    console.error('   Firebase Admin SDK initialization will likely fail.');
    console.error('   Set this variable to the path of your service account key file.');
    throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS');
  }

  // Initialize Admin SDK (already done above, just get the instance)
  console.timeLog('[globalSetup:adminInit]');

  // Wait for emulators
  await startAndWaitForEmulators();

  // Clear existing emulator data AND Prisma data
  await clearTestData();

  // Setup user in Firebase Auth AND Prisma, then save UID
  await setupUserAndSaveUid(adminAuth); // Pass the auth instance

  console.log('--- E2E Global Setup Complete --- END ---');
  console.timeEnd('[globalSetup]'); // End overall timer
}

async function globalTeardown() {
  console.log('--- E2E Global Teardown --- START ---');
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma client disconnected.');
  } catch (error) {
    console.error('❌ Error disconnecting Prisma client:', error);
  }
  console.log('--- E2E Global Teardown --- END ---');
}

// Export both setup and teardown
export default globalSetup;
export const teardown = globalTeardown;
