/**
 * This script sets up a test user in the Firebase Auth emulator for E2E tests.
 * Run with: node scripts/setup-test-user.js
 * Requires the Firebase emulators to be running: npm run firebase:emulators
 */
const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv');
const { initializeApp } = require('firebase/app');
const {
  getAuth,
  createUserWithEmailAndPassword,
  connectAuthEmulator,
  updateProfile,
} = require('firebase/auth');

// Load environment variables from .env.test or .env.local
const envPath = fs.existsSync(path.resolve(__dirname, '../.env.test'))
  ? path.resolve(__dirname, '../.env.test')
  : path.resolve(__dirname, '../.env.local');

dotenv.config({ path: envPath });

// Firebase configuration - using test values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-project-id',
};

// Test user credentials
const testUser = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Test123!',
  displayName: process.env.TEST_USER_DISPLAY_NAME || 'Test User',
};

async function setupTestUser() {
  try {
    console.log('Initializing Firebase app...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Connect to Auth emulator
    const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
    console.log(`Connecting to Firebase Auth emulator at ${emulatorHost}...`);
    connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });

    console.log(`Creating test user: ${testUser.email}`);

    try {
      // Create the test user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        testUser.email,
        testUser.password
      );

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: testUser.displayName,
      });

      console.log(`✅ Test user created successfully with UID: ${userCredential.user.uid}`);
      console.log(`✅ Display name set to: ${testUser.displayName}`);

      // Log useful information for tests
      const testUserInfo = {
        uid: userCredential.user.uid,
        email: testUser.email,
        displayName: testUser.displayName,
      };

      console.log('Test user information:');
      console.log(JSON.stringify(testUserInfo, null, 2));

      // Write test user info to a file for reference
      const testUserInfoPath = path.resolve(__dirname, '../tests/.auth/test-user-info.json');
      const testUserDir = path.dirname(testUserInfoPath);

      if (!fs.existsSync(testUserDir)) {
        fs.mkdirSync(testUserDir, { recursive: true });
      }

      fs.writeFileSync(testUserInfoPath, JSON.stringify(testUserInfo, null, 2));
      console.log(`✅ Test user info saved to: ${testUserInfoPath}`);
    } catch (error) {
      // If the user already exists, it's not an error
      if (error.code === 'auth/email-already-in-use') {
        console.log(`✅ Test user ${testUser.email} already exists in the emulator`);
      } else {
        throw error;
      }
    }

    console.log('✅ Test user setup complete');
  } catch (error) {
    console.error('❌ Error setting up test user:');
    console.error(error);
    process.exit(1);
  }
}

setupTestUser();
