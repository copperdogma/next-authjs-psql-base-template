// Setup for Firebase testing environment
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Set test timeout higher for Firebase emulator operations
jest.setTimeout(30000);

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Firebase Emulator Setup for Jest
const axios = require('axios').default;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env' });

// Setting longer Jest timeout for Firebase tests
jest.setTimeout(15000);

// Function to check if Firebase emulator is running
async function isEmulatorRunning() {
  try {
    // Try to connect to the Firestore emulator UI
    await axios.get('http://localhost:8080/', { timeout: 1000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Before all tests, check if emulator is running
beforeAll(async () => {
  const emulatorRunning = await isEmulatorRunning();
  
  if (!emulatorRunning) {
    console.warn('\n⚠️  Firebase emulator is not running!');
    console.warn('The Firebase security rules tests will be skipped.');
    console.warn('To run these tests, start the emulator with:');
    console.warn('npm run firebase:emulators\n');
    
    // Skip all tests in this file if emulator is not running
    jest.resetModules();
    jest.doMock('@firebase/rules-unit-testing', () => {
      return {
        initializeTestEnvironment: jest.fn().mockImplementation(() => {
          throw new Error('Firebase emulator not running');
        }),
        assertFails: jest.fn(),
        assertSucceeds: jest.fn(),
      };
    });
  }
}); 