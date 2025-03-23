// Configure React for testing
require('@testing-library/jest-dom');

// Import constants - we have to require instead of import due to CommonJS
const { FIREBASE_TEST_CONFIG } = require('../../utils/test-constants');

// Set Firebase environment variables from constants
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = FIREBASE_TEST_CONFIG.API_KEY;
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = FIREBASE_TEST_CONFIG.AUTH_DOMAIN;
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = FIREBASE_TEST_CONFIG.PROJECT_ID;
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = FIREBASE_TEST_CONFIG.STORAGE_BUCKET;
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = FIREBASE_TEST_CONFIG.MESSAGING_SENDER_ID;
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = FIREBASE_TEST_CONFIG.APP_ID;

// Configure Jest environment
global.React = require('react');

// Add any additional global test setup here for Node environment
