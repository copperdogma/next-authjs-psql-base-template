console.log('--- Loading tests/e2e/global-setup.ts ---'); // Add top-level log

import path from 'path';
import dotenv from 'dotenv';
import * as admin from 'firebase-admin'; // Import Firebase Admin SDK
import { PrismaClient } from '@prisma/client'; // Import Prisma Client
import bcrypt from 'bcrypt'; // <-- Import bcrypt

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
  // console.timeLog('[globalSetup:adminInit]'); // Remove potential cause of warning
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
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123!';
const TEST_USER_DISPLAY_NAME = process.env.TEST_USER_DISPLAY_NAME || 'Test User';
const AUTH_EMULATOR_HOST = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';

// Utility to wait for a port to be open
function waitForPort(port: number, host: string, timeout = 90000): Promise<void> {
  console.log(`[waitForPort] Starting check for ${host}:${port}`);
  const timerLabel = `[waitForPort] ${host}:${port}`;
  console.time(timerLabel);
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      const socket = require('net').createConnection(port, host);
      socket.on('connect', () => {
        socket.end();
        console.log(`✅ [waitForPort] Port ${host}:${port} is open.`);
        console.timeEnd(timerLabel);
        resolve();
      });
      socket.on('error', (err: NodeJS.ErrnoException) => {
        if (Date.now() - startTime > timeout) {
          console.error(`❌ [waitForPort] Timeout waiting for port ${host}:${port}`);
          console.timeEnd(timerLabel);
          reject(new Error(`Timeout waiting for port ${host}:${port}: ${err.message}`));
        } else {
          // console.log(`⏳ [waitForPort] Waiting for port ${host}:${port}... (${err.code})`); // Reduce noise
          setTimeout(check, 1000);
        }
      });
    };
    check();
  });
}

// --- Helper Functions for clearTestData ---

// Remove unused function _clearPrismaData
/*
async function _clearPrismaData() {
  try {
    // console.log('[clearTestData:_clearPrismaData] Clearing Prisma Session data...');
    await prisma.session.deleteMany({});
    // console.log(`[clearTestData:_clearPrismaData] Cleared ${sessionCount.count} sessions.`);

    // console.log('[clearTestData:_clearPrismaData] Clearing Prisma Account data...');
    await prisma.account.deleteMany({});
    // console.log(`[clearTestData:_clearPrismaData] Cleared ${accountCount.count} accounts.`);

    // console.log('[clearTestData:_clearPrismaData] Clearing Prisma User data...');
    await prisma.user.deleteMany({});
    // console.log(`[clearTestData:_clearPrismaData] Cleared ${userCount.count} users.`);

    console.log(
      '✅ [clearTestData:_clearPrismaData] Prisma data cleared (User, Account, Session).'
    );
  } catch (error) {
    console.warn(`⚠️ [clearTestData:_clearPrismaData] Could not clear Prisma data: ${error}`);
  }
}
*/

// Remove unused function _clearAuthEmulatorData
/*
async function _clearAuthEmulatorData() {
  try {
    const clearAuthUrl = `${AUTH_EMULATOR_URL}/emulator/v1/projects/${projectIdForEmulator}/accounts`;
    // console.log(`[clearTestData:_clearAuthEmulatorData] Attempting DELETE ${clearAuthUrl}`);
    // Use fetch or another method if axios was only used here
    // For simplicity, assume fetch is available in this Node env or polyfilled
    const response = await fetch(clearAuthUrl, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Failed to clear auth emulator: ${response.status} ${response.statusText}`);
    }
    console.log('✅ [clearTestData:_clearAuthEmulatorData] Auth emulator data cleared.');
  } catch (error: any) {
    // console.warn(
    //   `⚠️ [clearTestData:_clearAuthEmulatorData] Could not clear Auth emulator (project: ${projectIdForEmulator}): ${error.message}`
    // );
    if (error.response) {
      //   console.warn(
      //     `   Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`
      //   );
    }
  }
}
*/

// --- End Helper Functions for clearTestData ---

// Clear emulator data AND Prisma data
/*
async function clearTestData() {
  console.log('🧹 Clearing Firebase emulator data AND Prisma test data...');
  const timerLabel = '[clearTestData]';
  console.time(timerLabel);

  // Use helper functions
  await _clearPrismaData();
  await _clearAuthEmulatorData();

  console.timeEnd(timerLabel); // End timer
}
*/

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
    await auth.updateUser(userRecord.uid, { displayName: TEST_USER_DISPLAY_NAME });
    console.log(`✅ [setupUserAndSaveUid:_ensureFirebaseAuthUser] Existing user updated.`);
    return userRecord;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
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
 * Upserts the user data into the Prisma database AND sets the password hash.
 * @param userRecord - The Firebase UserRecord.
 * @throws Error if Prisma operation fails.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- Test setup function, slightly long/complex is acceptable
async function _upsertPrismaUser(userRecord: admin.auth.UserRecord): Promise<void> {
  console.log(
    `[setupUserAndSaveUid:_upsertPrismaUser] Upserting Prisma user for UID: ${userRecord.uid}...`
  );
  try {
    const userData = {
      id: userRecord.uid, // Ensure ID from Firebase is used
      name: userRecord.displayName,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified ? new Date() : null,
      image: userRecord.photoURL,
      role: 'USER' as const,
    };

    // Hash the password
    console.log(
      `[setupUserAndSaveUid:_upsertPrismaUser] Hashing password for user ${userRecord.uid}...`
    );
    const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 12);

    // Find existing user by email - Add check for userData.email
    if (!userData.email) {
      console.error(
        `❌ [setupUserAndSaveUid:_upsertPrismaUser] UserRecord missing email for UID: ${userRecord.uid}`
      );
      throw new Error('UserRecord is missing email');
    }
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: userData.email }, // Use checked email
      select: { id: true },
    });

    if (existingUserByEmail) {
      // User exists, update it with Firebase UID (if different) and hashed password
      console.log(
        `[setupUserAndSaveUid:_upsertPrismaUser] Found existing user by email (${userData.email}). Updating...`
      );
      await prisma.user.update({
        where: { email: userData.email }, // Use checked email
        data: {
          id: userRecord.uid, // Ensure Firebase UID is set
          name: userData.name,
          emailVerified: userData.emailVerified,
          image: userData.image,
          hashedPassword: hashedPassword, // Set the hashed password
        },
      });
      console.log(`✅ [setupUserAndSaveUid:_upsertPrismaUser] Existing Prisma user updated.`);
    } else {
      // User doesn't exist by email, create a new one
      console.log(
        `[setupUserAndSaveUid:_upsertPrismaUser] No existing user found by email (${userData.email}). Creating...`
      );
      await prisma.user.create({
        data: {
          ...userData,
          hashedPassword: hashedPassword, // Include hashed password on create
        },
      });
      console.log(`✅ [setupUserAndSaveUid:_upsertPrismaUser] New Prisma user created.`);
    }
  } catch (prismaError) {
    console.error(
      `❌ [setupUserAndSaveUid:_upsertPrismaUser] Failed to upsert Prisma user: ${prismaError}`
    );
    throw prismaError;
  }
}
// --- End Helper Functions for setupUserAndSaveUid ---

// Log relevant config details
function logConfigDetails() {
  console.log('--- [globalSetup:Config] Configuration ---');
  // console.log(`Service Account Path: ${SERVICE_ACCOUNT_PATH || 'Not Set (Expected for Emulator)'}`); // Less relevant for emulator
  // console.log(`Auth Emulator Host: ${AUTH_EMULATOR_HOST}`); // Already checked
  console.log(`Project ID: ${projectIdForEmulator}`);
  console.log(`Test User Email: ${TEST_USER_EMAIL}`);
  console.log('------------------------------------------');
}

/**
 * Starts and waits for emulators if they are not already running (detected by env var).
 */
async function startAndWaitForEmulators() {
  console.log('--- [globalSetup:Emulators] Starting/Waiting for Emulators ---');
  // No need to start here, assume started by exec command
  // Check if ports are available
  const authPort = parseInt(AUTH_EMULATOR_HOST.split(':')[1] || '9099', 10);
  const authHost = AUTH_EMULATOR_HOST.split(':')[0] || 'localhost';
  // Removed Firestore emulator wait as it's not used in global setup
  await waitForPort(authPort, authHost);
  console.log('✅ Auth emulator port is ready.');
  console.log('------------------------------------------');
}

/**
 * Sets up the test user in Firebase Auth and Prisma DB, saving UID for tests.
 */
async function setupUserAndSaveUid(): Promise<void> {
  console.log('--- [globalSetup:UserSetup] Setting up test user ---');
  // const timerLabel = '[globalSetup:UserSetup]'; // Remove timer
  // console.time(timerLabel);
  const firebaseUser = await _ensureFirebaseAuthUser(adminAuth);
  await _upsertPrismaUser(firebaseUser);
  // Save the user's UID to a file accessible by tests (alternative to env var)
  // Playwright recommends against direct env var setting in global setup
  // fs.writeFileSync('./tests/.auth/testUserUid.json', JSON.stringify({ uid: firebaseUser.uid }));
  // console.log(`✅ User UID ${firebaseUser.uid} saved for tests.`); // Logged inside helpers
  // console.timeEnd(timerLabel);
  console.log('------------------------------------------');
}

async function globalSetup() {
  console.log('--- [globalSetup] Starting Playwright Global Setup ---');
  // const overallTimerLabel = '[globalSetup:Overall]'; // Remove timer
  // console.time(overallTimerLabel);

  logConfigDetails();
  // await clearTestData(); // Optionally clear data on each full run
  await startAndWaitForEmulators();
  await setupUserAndSaveUid();

  // console.timeEnd(overallTimerLabel); // Remove timer
  console.log('--- [globalSetup] Playwright Global Setup Finished ---');
}

// Teardown function (optional, example)
async function globalTeardown() {
  console.log('=== Running Playwright Global Teardown ===');
  // Add any cleanup logic here if needed, e.g., stopping services
  await prisma.$disconnect(); // Ensure Prisma is disconnected
  console.log('=== Global Teardown Complete ===');
}

// Export the setup function as the default export
export default globalSetup;
// If you have teardown logic, you might need to configure it differently
// depending on your Playwright config version.
export { globalTeardown }; // Exporting teardown separately
