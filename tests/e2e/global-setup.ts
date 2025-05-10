console.log('--- Loading tests/e2e/global-setup.ts ---'); // Add top-level log

import dotenv from 'dotenv';
import * as admin from 'firebase-admin';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Load .env.test for emulator hosts and test user credentials
dotenv.config({ path: '.env.test' });

// --- Initialize clients ---
const prisma = new PrismaClient();
const projectIdForEmulator = process.env.FIREBASE_PROJECT_ID || 'next-firebase-base-template';

// Ensure emulator hosts are set
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
}

// Test user configuration
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123!';
const TEST_USER_DISPLAY_NAME = process.env.TEST_USER_DISPLAY_NAME || 'Test User';

// --- Initialize Firebase Admin ---
function initializeFirebaseAdmin(): admin.auth.Auth {
  let adminApp: admin.app.App;
  try {
    console.log(
      `[globalSetup] Initializing Firebase Admin SDK for project: ${projectIdForEmulator}`
    );
    adminApp = admin.initializeApp({
      projectId: projectIdForEmulator,
    });
    console.log('✅ Firebase Admin SDK initialized.');
  } catch (error: any) {
    if (error.code === 'app/duplicate-app') {
      console.log('🔸 Firebase Admin SDK already initialized, getting default app.');
      adminApp = admin.app();
    } else {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }
  return adminApp.auth();
}

// --- Network Utilities ---
function waitForPort(port: number, host: string, timeout = 90000): Promise<void> {
  console.log(`[waitForPort] Starting check for ${host}:${port}`);
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
          console.error(`❌ Timeout waiting for port ${host}:${port}`);
          reject(new Error(`Timeout waiting for port ${host}:${port}: ${err.message}`));
        } else {
          setTimeout(check, 1000);
        }
      });
    };
    check();
  });
}

// --- Database Operations ---
async function checkLastSignedInField(): Promise<boolean> {
  try {
    const checkField = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'lastSignedInAt'
    `;
    const hasLastSignedInField = Array.isArray(checkField) && checkField.length > 0;
    console.log(`[Setup] lastSignedInAt field exists: ${hasLastSignedInField}`);
    return hasLastSignedInField;
  } catch (error) {
    console.warn(`[Setup] Error checking lastSignedInAt field: ${error}`);
    return false;
  }
}

// Update existing user with Prisma or raw query as fallback
async function updateExistingUser(
  email: string | undefined,
  userData: {
    id: string;
    name: string | undefined | null;
    emailVerified: Date | null;
    image: string | undefined | null;
  },
  hashedPassword: string,
  hasLastSignedInField: boolean
): Promise<void> {
  if (!email) {
    console.error('❌ [Setup] Cannot update user without email');
    throw new Error('Cannot update user without email');
  }

  console.log(`[Setup] Updating existing user with email: ${email}`);

  try {
    // Try using Prisma client first
    await prisma.user.update({
      where: { email },
      data: {
        id: userData.id,
        name: userData.name ?? null,
        emailVerified: userData.emailVerified,
        image: userData.image ?? null,
        hashedPassword,
        ...(hasLastSignedInField ? { lastSignedInAt: new Date() } : {}),
      },
    });
    console.log(`✅ [Setup] User updated successfully with Prisma client.`);
  } catch (error) {
    console.warn(`[Setup] Prisma update failed, using raw query: ${error}`);

    // Fall back to raw query if Prisma update fails
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "id" = ${userData.id},
          "name" = ${userData.name ?? null},
          "hashedPassword" = ${hashedPassword}
      WHERE "email" = ${email}
    `;
    console.log(`✅ [Setup] User updated successfully with raw query.`);
  }
}

// Create new user
async function createNewUser(
  userData: {
    id: string;
    name: string | undefined | null;
    email: string | undefined;
    emailVerified: Date | null;
    image: string | undefined | null;
    role: UserRole;
  },
  hashedPassword: string
): Promise<void> {
  if (!userData.email) {
    console.error('❌ [Setup] Cannot create user without email');
    throw new Error('Cannot create user without email');
  }

  console.log(`[Setup] Creating new user with email: ${userData.email}`);
  await prisma.user.create({
    data: {
      id: userData.id,
      name: userData.name ?? null,
      email: userData.email,
      emailVerified: userData.emailVerified,
      image: userData.image ?? null,
      role: userData.role,
      hashedPassword,
    },
  });
  console.log(`✅ [Setup] New user created with ID ${userData.id}.`);
}

// Unified user database management - now simplified
async function upsertPrismaUser(
  userRecord: admin.auth.UserRecord,
  hasLastSignedInField: boolean
): Promise<void> {
  try {
    // Prepare common user data
    const userData = {
      id: userRecord.uid,
      name: userRecord.displayName,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified ? new Date() : null,
      image: userRecord.photoURL,
      role: 'USER' as UserRole,
    };

    console.log(`[Setup] Hashing password for user ${userRecord.uid}`);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, saltRounds);

    // Check if user exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: userRecord.email },
      select: { id: true },
    });

    if (existingUserByEmail) {
      await updateExistingUser(userRecord.email, userData, hashedPassword, hasLastSignedInField);
    } else {
      await createNewUser(userData, hashedPassword);
    }
  } catch (error) {
    console.error(`❌ [Setup] Error upserting user: ${(error as Error).message}`);
    throw error;
  }
}

// --- Firebase Operations ---
async function ensureFirebaseAuthUser(auth: admin.auth.Auth): Promise<admin.auth.UserRecord> {
  console.log('[Setup] Checking/Creating Firebase Auth user');
  try {
    // Check if user exists
    const userRecord = await auth.getUserByEmail(TEST_USER_EMAIL);
    await auth.updateUser(userRecord.uid, { displayName: TEST_USER_DISPLAY_NAME });
    console.log(`✅ [Setup] Existing user updated in Firebase Auth.`);
    return userRecord;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      try {
        // Create new user
        const newUserRecord = await auth.createUser({
          email: TEST_USER_EMAIL,
          emailVerified: true,
          password: TEST_USER_PASSWORD,
          displayName: TEST_USER_DISPLAY_NAME,
        });
        console.log(`✅ [Setup] New user created in Firebase Auth: ${newUserRecord.uid}`);
        return newUserRecord;
      } catch (createError) {
        console.error(`❌ [Setup] Failed to create user: ${createError}`);
        throw createError;
      }
    } else {
      console.error(`❌ [Setup] Failed to get/update user: ${error.message}`);
      throw error;
    }
  }
}

// --- Main Setup Functions ---
async function setupUserAndSaveUid(auth: admin.auth.Auth): Promise<void> {
  console.log('--- Setting up test user ---');

  // 1. Ensure the user exists in Firebase Auth
  const firebaseUser = await ensureFirebaseAuthUser(auth);

  // 2. Check if lastSignedInAt field exists in DB schema
  const hasLastSignedInField = await checkLastSignedInField();

  // 3. Upsert user in Prisma
  await upsertPrismaUser(firebaseUser, hasLastSignedInField);

  console.log('--- Test user setup complete ---');
}

async function startAndWaitForEmulators(): Promise<void> {
  console.log('--- Waiting for Emulators ---');
  const authPort = parseInt(process.env.FIREBASE_AUTH_EMULATOR_HOST?.split(':')[1] || '9099', 10);
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST?.split(':')[0] || 'localhost';
  await waitForPort(authPort, authHost);
  console.log('✅ Auth emulator port is ready.');
}

// --- Global Setup Function ---
async function globalSetup(): Promise<void> {
  console.log('--- Starting Playwright Global Setup ---');

  // 1. Wait for emulators (assumed to be started by the test command)
  await startAndWaitForEmulators();

  // 2. Initialize Firebase Admin
  const adminAuth = initializeFirebaseAdmin();

  // 3. Set up test user
  await setupUserAndSaveUid(adminAuth);

  console.log('--- Playwright Global Setup Finished ---');
}

// --- Global Teardown Function ---
async function globalTeardown(): Promise<void> {
  console.log('=== Running Playwright Global Teardown ===');
  await prisma.$disconnect();
  console.log('=== Global Teardown Complete ===');
}

export default globalSetup;
export { globalTeardown };
