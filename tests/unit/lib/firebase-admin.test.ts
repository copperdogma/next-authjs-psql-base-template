/**
 * @jest-environment node
 */

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    settings: jest.fn(),
  };

  const mockApp = {
    firestore: jest.fn(() => mockFirestore),
  };

  return {
    credential: {
      cert: jest.fn().mockReturnValue('mocked-credential'),
    },
    initializeApp: jest.fn().mockReturnValue(mockApp),
    firestore: jest.fn(() => mockFirestore),
    apps: [],
    app: jest.fn(() => mockApp),
  };
});

describe('Firebase Admin SDK', () => {
  // Save original environment variables
  const savedEnv = { ...process.env };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Reset environment
    process.env = { ...savedEnv };
  });

  afterEach(() => {
    // Restore environment and console mocks
    process.env = { ...savedEnv };
    jest.restoreAllMocks();
  });

  test('should successfully import firebase-admin module', () => {
    // Act & Assert: Import the module - this should not throw an error
    expect(() => {
      const firebaseAdmin = require('../../../lib/firebase-admin');
      // Verify we get something back
      expect(firebaseAdmin).toBeDefined();
    }).not.toThrow();
  });
});
