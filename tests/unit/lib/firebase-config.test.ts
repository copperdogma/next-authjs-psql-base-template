/**
 * @jest-environment node
 */

// Mock the Firebase imports
jest.mock('@firebase/app', () => ({
  initializeApp: jest.fn(() => 'mockedFirebaseApp'),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => 'existingFirebaseApp'),
}));

jest.mock('@firebase/auth', () => ({
  getAuth: jest.fn(() => 'mockedAuth'),
  connectAuthEmulator: jest.fn(),
}));

jest.mock('@firebase/firestore', () => ({
  getFirestore: jest.fn(() => 'mockedFirestore'),
  connectFirestoreEmulator: jest.fn(),
}));

// Store original environment
const originalEnv = { ...process.env };

// Mock a fake window to ensure client-side detection works
const createMockWindow = () => {
  const mockWindow = {} as Window & typeof globalThis;
  const originalWindow = global.window;
  global.window = mockWindow;
  return () => {
    global.window = originalWindow;
  };
};

describe('Firebase Config', () => {
  let mockConsole;
  let firebaseImports;

  beforeEach(() => {
    // Mock console methods
    mockConsole = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };

    // Reset process.env for each test
    process.env = { ...originalEnv };

    // Reset module cache to ensure clean module loading
    jest.resetModules();

    // Get module imports
    firebaseImports = {
      initializeApp: require('@firebase/app').initializeApp,
      getApps: require('@firebase/app').getApps,
      getApp: require('@firebase/app').getApp,
      getAuth: require('@firebase/auth').getAuth,
      connectAuthEmulator: require('@firebase/auth').connectAuthEmulator,
      getFirestore: require('@firebase/firestore').getFirestore,
      connectFirestoreEmulator: require('@firebase/firestore').connectFirestoreEmulator,
    };

    // Clear mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore all mocks
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  describe('Module Exports', () => {
    test('should not initialize Firebase on server side', () => {
      // Simulate server-side environment by making the window property undefined
      const originalWindow = global.window;
      // Use type assertion to make TypeScript happy
      global.window = undefined as unknown as Window & typeof globalThis;

      // Import the module
      const { firebaseApp, auth, firestore } = require('../../../lib/firebase-config');

      expect(firebaseApp).toBeUndefined();
      expect(auth).toBeUndefined();
      expect(firestore).toBeUndefined();
      expect(firebaseImports.initializeApp).not.toHaveBeenCalled();

      // Restore window
      global.window = originalWindow;
    });

    test('should initialize Firebase on client side', () => {
      // Setup client environment
      const restoreWindow = createMockWindow();

      // Set required env vars
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';

      // Ensure getApps returns empty array for initialization
      firebaseImports.getApps.mockReturnValue([]);

      // Import the module
      const { firebaseApp, auth, firestore } = require('../../../lib/firebase-config');

      expect(firebaseImports.initializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-api-key',
          projectId: 'test-project',
        })
      );
      expect(firebaseImports.getAuth).toHaveBeenCalled();
      expect(firebaseImports.getFirestore).toHaveBeenCalled();

      // Cleanup
      restoreWindow();
    });

    test('should use existing app if already initialized', () => {
      // Setup client environment
      const restoreWindow = createMockWindow();

      // Mock getApps to return an existing app
      firebaseImports.getApps.mockReturnValue(['existingApp']);

      // Import the module
      require('../../../lib/firebase-config');

      // When an app exists, getApp should be called instead of initializeApp
      expect(firebaseImports.getApp).toHaveBeenCalled();
      expect(firebaseImports.initializeApp).not.toHaveBeenCalled();

      // Cleanup
      restoreWindow();
    });

    test('should connect to emulators when configured', () => {
      // Setup client environment
      const restoreWindow = createMockWindow();

      // Set emulator environment variables
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';
      // We're already in test environment, which should connect to emulators

      // Mock getApps for initialization
      firebaseImports.getApps.mockReturnValue([]);

      // Import directly to ensure mocks are called
      jest.isolateModules(() => {
        require('../../../lib/firebase-config');

        // Verify emulator connections were attempted
        expect(firebaseImports.connectAuthEmulator).toHaveBeenCalled();
        expect(firebaseImports.connectFirestoreEmulator).toHaveBeenCalled();
      });

      // Cleanup
      restoreWindow();
    });
  });
});
