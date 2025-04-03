// Add polyfills for Node.js environment when needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock environment variables for testing
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-storage-bucket';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'test-messaging-sender-id';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = 'test-measurement-id';
process.env.FIREBASE_ADMIN_PROJECT_ID = 'test-admin-project-id';
process.env.FIREBASE_ADMIN_CLIENT_EMAIL = 'test-admin-client-email';
process.env.FIREBASE_ADMIN_PRIVATE_KEY = 'test-admin-private-key';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';

// Set app URL from environment or default to a consistent test port
const TEST_PORT = process.env.TEST_PORT || '3000';
const APP_URL = `http://localhost:${TEST_PORT}`;

// Use APP_URL for all URL-dependent environment variables
process.env.NEXT_PUBLIC_APP_URL = APP_URL;
process.env.NEXTAUTH_URL = APP_URL;
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';
