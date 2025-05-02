#!/usr/bin/env node

/**
 * Creates the test user in the Firebase Auth emulator AND syncs/sets the
 * bcryptjs-compatible hash in the Prisma database.
 * Reads credentials from environment variables (TEST_USER_EMAIL, TEST_USER_PASSWORD).
 */

require('dotenv').config({ path: '.env.test' }); // Load .env.test
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10; // Standard salt rounds for bcrypt

// Emulator detection - crucial for targeting the local emulator
const isEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (!isEmulator) {
  console.error('❌ FIREBASE_AUTH_EMULATOR_HOST environment variable not set.');
  console.error('   Please ensure Firebase emulators are running.');
  process.exit(1);
}

// Use dummy credentials when connecting to the emulator
// Note: Actual service account keys are NOT needed for the emulator.
// The project ID should match the one used to start the emulator (from firebase.json or --project flag).
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'next-firebase-base-template'; // Fallback to default if not set
admin.initializeApp({
  projectId: projectId,
  credential: admin.credential.applicationDefault(), // Necessary for initialization but ignored by emulator
});

const auth = admin.auth();
const testEmail = process.env.TEST_USER_EMAIL;
const testPassword = process.env.TEST_USER_PASSWORD;

if (!testEmail || !testPassword) {
  console.error('❌ TEST_USER_EMAIL or TEST_USER_PASSWORD environment variables not set.');
  console.error('   Please ensure they are defined in your .env.test file.');
  process.exit(1);
}

// --- Helper Functions ---

async function ensureFirebaseAuthUser(email, password) {
  console.log(`Attempting to ensure Firebase Auth user: ${email}...`);
  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Firebase Auth user ${email} already exists. Updating password.`);
    await auth.updateUser(userRecord.uid, { password });
    console.log(
      `✅ Successfully updated Firebase Auth user: ${userRecord.email} (UID: ${userRecord.uid})`
    );

    return userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`Firebase Auth user ${email} not found. Creating.`);
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: true, // Assuming verified for test users
      });
      console.log(
        `✅ Successfully created Firebase Auth user: ${userRecord.email} (UID: ${userRecord.uid})`
      );

      return userRecord;
    } else {
      console.error('❌ Error ensuring Firebase user:', error);
      throw error;
    }
  }
}

async function updatePrismaUserHash(userRecord, passwordToHash) {
  console.log(`Hashing password with bcryptjs for Prisma update...`);
  const hashedPassword = await bcrypt.hash(passwordToHash, SALT_ROUNDS);
  console.log(`Updating Prisma user ${userRecord.email} with hashed password...`);
  try {
    const updatedPrismaUser = await prisma.user.update({
      where: { email: userRecord.email },
      data: {
        hashedPassword,
        name: userRecord.displayName || 'Test User',
        emailVerified: userRecord.emailVerified ? new Date() : null,
      },
    });
    console.log(
      `✅ Successfully updated Prisma user: ${updatedPrismaUser.email} with bcryptjs hash.`
    );
  } catch (prismaError) {
    if (prismaError.code === 'P2025') {
      console.warn(`Prisma user ${userRecord.email} not found for update. Consider creating.`);

      // Decide if creation is needed here or rely on adapter
    } else {
      console.error('❌ Error updating Prisma user hash:', prismaError);
      throw prismaError;
    }
  }
}

// --- Main Logic ---
async function main() {
  // Step 1: Ensure Firebase user exists and has correct password
  const firebaseUser = await ensureFirebaseAuthUser(testEmail, testPassword);

  // Step 2: Ensure Prisma user has the correct bcrypt hash
  await updatePrismaUserHash(firebaseUser, testPassword);

  console.log('✅ Test user setup complete.');
}

main()
  .catch(async e => {
    console.error('❌ An error occurred during test user setup:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
