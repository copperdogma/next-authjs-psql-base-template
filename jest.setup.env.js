// Add polyfills for Node.js environment when needed
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock environment variables for testing
// Firebase environment variables removed

// Set app URL from environment or default to a consistent test port
const TEST_PORT = process.env.TEST_PORT || '3000';
const APP_URL = `http://localhost:${TEST_PORT}`;

// Use APP_URL for all URL-dependent environment variables
process.env.NEXT_PUBLIC_APP_URL = APP_URL;
process.env.NEXTAUTH_URL = APP_URL;
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';

// Set environment variables for testing
// Load environment variables from .env.test
require('dotenv').config({ path: '.env.test' });

// Disable Prisma Accelerate/Data Proxy features in tests - REMOVED as it didn't fix the issue
// process.env.PRISMA_DISABLE_QUAIL = 'true';
