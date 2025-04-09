#!/usr/bin/env node

/**
 * Script to create a test user in Firebase Auth emulator for E2E testing
 *
 * This ensures a consistent test user is available for authentication in tests
 */

const path = require('path');

const dotenv = require('dotenv');
const { initializeApp } = require('firebase/app');
const {
  getAuth,
  createUserWithEmailAndPassword,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  updateProfile,
} = require('firebase/auth');

// Load environment variables from .env.test
const envPath = path.resolve(__dirname, '../.env.test');
console.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// Test user information
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Test123!',
  displayName: process.env.TEST_USER_DISPLAY_NAME || 'Test User',
};

// Log environment variables - important for debugging
console.log('=== Environment Variables ===');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`USE_FIREBASE_EMULATOR: ${process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR}`);
console.log(`AUTH_EMULATOR_HOST: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`);
console.log(`TEST_PORT: ${process.env.TEST_PORT}`);
console.log('===========================');

// Firebase configuration for connecting to emulator
const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'localhost',
  projectId: 'next-firebase-base-template',
};

// Helper function to create a new user
async function createUser(auth) {
  console.log('Attempting to create test user...');
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    TEST_USER.email,
    TEST_USER.password
  );

  // Set display name
  await updateProfile(userCredential.user, {
    displayName: TEST_USER.displayName,
  });

  console.log(`✅ Test user created successfully with UID: ${userCredential.user.uid}`);

  return userCredential;
}

// Helper function to verify existing user
async function verifyExistingUser(auth) {
  console.log('Test user already exists, signing in to verify...');

  try {
    // Sign in to verify credentials work
    const userCredential = await signInWithEmailAndPassword(
      auth,
      TEST_USER.email,
      TEST_USER.password
    );

    console.log(`✅ Verified existing test user with UID: ${userCredential.user.uid}`);

    return userCredential;
  } catch (signInError) {
    console.error('❌ Failed to verify existing test user:', signInError);
    console.log('Error code:', signInError.code);
    console.log('Error message:', signInError.message);
    process.exit(1);
  }
}

// Helper function to handle user creation errors
async function handleUserCreationError(auth, error) {
  if (error.code === 'auth/email-already-in-use') {
    return await verifyExistingUser(auth);
  } else {
    console.error('❌ Failed to create test user:', error);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);

    process.exit(1);
  }
}

// Initialize Firebase app and auth
function initializeFirebase() {
  console.log('Initializing Firebase app...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Extract emulator host and port from environment variable
  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
  const [host, port] = emulatorHost.split(':');
  const emulatorUrl = `http://${host}:${port}`;

  // Connect to Auth emulator with proper options
  console.log(`Connecting to Auth emulator at ${emulatorUrl}...`);
  connectAuthEmulator(auth, emulatorUrl, {
    disableWarnings: true,
  });

  return auth;
}

// Handle user creation process
async function createOrVerifyUser(auth) {
  try {
    // Try to create the user
    return await createUser(auth);
  } catch (error) {
    return await handleUserCreationError(auth, error);
  }
}

async function setupTestUser() {
  console.log('Setting up test user in Firebase Auth emulator...');
  console.log(`Email: ${TEST_USER.email}`);
  console.log(`Display Name: ${TEST_USER.displayName}`);

  try {
    // Initialize Firebase app and connect to auth emulator
    const auth = initializeFirebase();

    // Create or verify the test user
    await createOrVerifyUser(auth);

    console.log('✅ Test user setup complete.');
  } catch (error) {
    console.error('❌ Firebase setup error:', error);
    console.log('\nMake sure the Firebase Auth emulator is running:');
    console.log('npm run firebase:emulators');

    process.exit(1);
  }
}

// Run the setup
setupTestUser().catch(error => {
  console.error('Unhandled error:', error);

  process.exit(1);
});
