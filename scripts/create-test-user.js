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

// --- Main Logic ---
async function main() {
  // Wrap logic in async function
  console.log(`Attempting to create/update Firebase Auth user: ${testEmail}...`);
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(testEmail);
    console.log(`Firebase Auth user ${testEmail} already exists. Updating password.`);
    await auth.updateUser(userRecord.uid, { password: testPassword });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`Firebase Auth user ${testEmail} not found. Creating.`);
      userRecord = await auth.createUser({
        email: testEmail,
        password: testPassword,
        emailVerified: true,
      });
    } else {
      throw error; // Rethrow unexpected errors
    }
  }
  console.log(
    `✅ Successfully ensured Firebase Auth user: ${userRecord.email} (UID: ${userRecord.uid})`
  );

  // Now, ensure the Prisma user has the correct bcryptjs hash
  console.log(`Hashing password with bcryptjs...`);
  const hashedPassword = await bcrypt.hash(testPassword, SALT_ROUNDS);
  console.log(`Updating Prisma user ${testEmail} with hashed password...`);

  try {
    const updatedPrismaUser = await prisma.user.update({
      where: { email: testEmail },
      data: {
        hashedPassword: hashedPassword,

        // Optionally ensure other fields are synced if needed
        name: userRecord.displayName || 'Test User',
        emailVerified: userRecord.emailVerified ? new Date() : null,
      },
    });
    console.log(
      `✅ Successfully updated Prisma user: ${updatedPrismaUser.email} with bcryptjs hash.`
    );
  } catch (prismaError) {
    // Handle case where user might not exist in Prisma yet (though adapter should handle this)
    if (prismaError.code === 'P2025') {
      console.warn(
        `Prisma user ${testEmail} not found for update. This might indicate an adapter issue.`
      );

      // Optionally attempt prisma.user.create here if needed, but adapter should handle creation.
    } else {
      console.error('❌ Error updating Prisma user:', prismaError);
      throw prismaError; // Rethrow if it's not a record-not-found error
    }
  }
} // End async function main

main() // Call the async function
  .catch(async e => {
    console.error('❌ An error occurred during test user setup:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
