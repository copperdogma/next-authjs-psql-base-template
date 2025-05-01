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
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS; // Get path from env

const AUTH_EMULATOR_URL = `http://${AUTH_EMULATOR_HOST}`;

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

// --- End Helper Functions for clearTestData ---

// Clear emulator data AND Prisma data
async function clearTestData() {
  console.log('🧹 Clearing Firebase emulator data AND Prisma test data...');
  const timerLabel = '[clearTestData]';
  console.time(timerLabel);

  // Use helper functions
  await _clearPrismaData();
  await _clearAuthEmulatorData();

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
    // Only update fields that might change, e.g., displayName
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
 * Upserts the user data into the Prisma database AND sets the password hash.
 * @param userRecord - The Firebase UserRecord.
 * @throws Error if Prisma operation fails.
 */
async function _upsertPrismaUser(userRecord: admin.auth.UserRecord): Promise<void> {
  console.log(
    `[setupUserAndSaveUid:_upsertPrismaUser] Upserting Prisma user for UID: ${userRecord.uid}...`
  );
  try {
    const userData = {
      name: userRecord.displayName,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified ? new Date() : null,
      image: userRecord.photoURL,
      role: 'USER' as const, // Ensure role matches Prisma type
    };

    // Upsert basic user data
    const upsertedUser = await prisma.user.upsert({
      where: { id: userRecord.uid },
      update: userData,
      create: {
        id: userRecord.uid,
        ...userData,
      },
      select: { id: true }, // Only select id
    });
    console.log(`✅ [setupUserAndSaveUid:_upsertPrismaUser] Basic Prisma user data upserted.`);

    // Hash the password
    console.log(
      `[setupUserAndSaveUid:_upsertPrismaUser] Hashing password for user ${userRecord.uid}...`
    );
    const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 12); // Use 12 rounds

    // Update the user with the hashed password
    await prisma.user.update({
      where: { id: upsertedUser.id },
      data: { hashedPassword: hashedPassword },
    });
    console.log(`✅ [setupUserAndSaveUid:_upsertPrismaUser] Hashed password set for Prisma user.`);
  } catch (prismaError) {
    console.error(
      `❌ [setupUserAndSaveUid:_upsertPrismaUser] Failed to upsert Prisma user or set password: ${prismaError}`
    );
    throw prismaError;
  }
}
// --- End Helper Functions for setupUserAndSaveUid ---

// Log relevant config details
function logConfigDetails() {
  console.log('🔧 Configuration Details:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  TEST_USER_EMAIL: ${TEST_USER_EMAIL}`);
  console.log(`  FIREBASE_PROJECT_ID: ${projectIdForEmulator}`);
  console.log(`  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: ${AUTH_EMULATOR_HOST}`);
  console.log(
    `  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: ${process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR}`
  );
  console.log(`  PLAYWRIGHT_TEST_BASE_URL: ${process.env.PLAYWRIGHT_TEST_BASE_URL}`);
  console.log(`  ALLOW_TEST_ENDPOINTS: ${process.env.ALLOW_TEST_ENDPOINTS}`);
  console.log(`  GOOGLE_APPLICATION_CREDENTIALS: ${SERVICE_ACCOUNT_PATH ? 'Set' : 'Not Set'}`);
  console.log('=========================================================');
}

/**
 * Starts and waits for emulators if they are not already running (detected by env var).
 */
async function startAndWaitForEmulators() {
  const timerLabel = '[startAndWaitForEmulators]';
  console.time(timerLabel);

  // Firebase emulators are started externally by `firebase emulators:exec` in test:e2e script
  // We just need to wait for them to be ready
  console.log('⏳ Waiting for emulators to be ready (started via firebase emulators:exec).');

  try {
    const authPort = parseInt(AUTH_EMULATOR_HOST.split(':')[1] || '9099', 10);
    const authHost = AUTH_EMULATOR_HOST.split(':')[0] || 'localhost';

    await waitForPort(authPort, authHost);
    // Firestore port wait removed
    console.log('✅ Firebase Emulators appear to be ready.');
  } catch (error) {
    console.error('❌ Error waiting for emulators:', error);
    throw error; // Re-throw error to fail the setup
  }

  // Add a small delay to ensure services are fully initialized after ports are open
  console.log('⏳ Short delay for service initialization...');
  await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
  console.timeEnd(timerLabel); // End timer
}

// Main Global Setup Function (MODIFIED)
async function globalSetup() {
  console.log(
    '\n=== Running Playwright Global Setup (Timestamp:',
    new Date().toISOString(),
    ') ==='
  );
  const timerLabel = '[globalSetup:total]';
  console.time(timerLabel);

  logConfigDetails(); // Log env details

  try {
    const startEmulatorsTimerLabel = '[startAndWaitForEmulators]';
    console.time(startEmulatorsTimerLabel);
    await startAndWaitForEmulators(); // Wait for emulators
    console.timeEnd(startEmulatorsTimerLabel);

    await clearTestData(); // Clear data before setup

    const setupUserTimerLabel = '[setupUser]';
    console.time(setupUserTimerLabel);
    const userRecord = await _ensureFirebaseAuthUser(adminAuth);
    await _upsertPrismaUser(userRecord);
    console.log(`✅ User setup complete. UID: ${userRecord.uid}`);
    console.timeEnd(setupUserTimerLabel);

    console.log('🎉 Global setup finished (User created/verified). Test user UID:', userRecord.uid);
  } catch (error) {
    console.error('❌❌❌ Global setup failed:', error);
    process.exit(1); // Exit with error code if setup fails critically
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client
    console.timeEnd(timerLabel); // End total timer
    console.log('=========================================================\n');
  }
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
