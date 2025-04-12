/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { LoggerService } from '../../../lib/interfaces/services';

// Mock the firebase-admin module
const mockFirestore = jest.fn().mockReturnValue({
  collection: jest.fn().mockReturnValue({
    doc: jest.fn().mockReturnValue({
      set: jest.fn(),
      get: jest.fn(),
    }),
  }),
  useEmulator: jest.fn(),
  settings: jest.fn(),
});

// Define a type for the mocked app
interface MockApp {
  firestore: typeof mockFirestore;
}

// Mock createContextLogger function to track if it's called
const mockCreateContextLogger = jest.fn().mockImplementation(() => mockLogger);

// Create a mock logger before using it in the mock implementation
const mockLogger: LoggerService = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

const mockAdmin = {
  apps: [] as MockApp[],
  initializeApp: jest.fn().mockImplementation(config => {
    const app: MockApp = { firestore: mockFirestore };
    mockAdmin.apps.push(app);
    return app;
  }),
  credential: {
    cert: jest.fn(),
  },
  firestore: mockFirestore,
};

// Mock both firebase-admin and the logger-service
jest.mock('firebase-admin', () => mockAdmin);
jest.mock('../../../lib/services/logger-service', () => ({
  createContextLogger: mockCreateContextLogger,
}));

describe('FirebaseAdminModule', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Reset mocks and the apps array before each test
    mockAdmin.apps.length = 0;
    jest.clearAllMocks();
    jest.resetModules();
    process.env.FIREBASE_PROJECT_ID = 'next-firebase-base-template';
  });

  afterEach(() => {
    jest.replaceProperty(process.env, 'NODE_ENV', originalNodeEnv);
    delete process.env.FIREBASE_PROJECT_ID;
  });

  it('should initialize with a custom logger', async () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'test');

    // Import the module after setting environment variables
    const { FirebaseAdminModule } = await import('../../../lib/firebase-admin');

    // Create instance with mock logger
    const firebaseAdminModule = new FirebaseAdminModule(mockLogger);
    const admin = firebaseAdminModule.getAdmin();

    // Verify logger was used
    expect(admin).toBeDefined();
    expect(mockLogger.debug).toHaveBeenCalled();
  });

  it('should initialize with emulators in test environment', async () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'test');

    // Import the module after setting environment variables
    const { FirebaseAdminModule } = await import('../../../lib/firebase-admin');

    // Create instance with mock logger
    const firebaseAdminModule = new FirebaseAdminModule(mockLogger);
    const admin = firebaseAdminModule.getAdmin();

    // Verify we're using the emulator strategy
    expect(mockAdmin.initializeApp).toHaveBeenCalledWith({
      projectId: 'next-firebase-base-template',
    });
    expect(admin).toBeDefined();
  });

  it('should initialize with credentials in production environment', async () => {
    // Set production environment and credentials
    jest.replaceProperty(process.env, 'NODE_ENV', 'production');
    process.env.FIREBASE_PROJECT_ID = 'prod-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'prod@example.com';
    process.env.FIREBASE_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----prod_key-----END PRIVATE KEY-----';

    // Delete emulator configs to ensure we use production
    delete process.env.USE_FIREBASE_EMULATOR;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIRESTORE_EMULATOR_HOST;

    // Import the module after setting environment variables
    const { FirebaseAdminModule } = await import('../../../lib/firebase-admin');

    // Create instance with mock logger
    const firebaseAdminModule = new FirebaseAdminModule(mockLogger);
    const admin = firebaseAdminModule.getAdmin();

    // Verify we're using credentials
    expect(mockAdmin.credential.cert).toHaveBeenCalledWith({
      projectId: 'prod-project',
      clientEmail: 'prod@example.com',
      privateKey: '-----BEGIN PRIVATE KEY-----\nprod_key\n-----END PRIVATE KEY-----',
    });
    expect(admin).toBeDefined();

    // Clean up environment variables
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
  });

  it('should handle initialization errors gracefully', async () => {
    // We'll use a simpler approach than isolateModules for this test

    // Temporarily make initializeApp throw an error
    const originalInitializeApp = mockAdmin.initializeApp;
    mockAdmin.initializeApp = jest.fn().mockImplementation(() => {
      throw new Error('Initialization failed');
    });

    try {
      // Import the module after modifying the mock
      const { FirebaseAdminModule } = await import('../../../lib/firebase-admin');

      // Create instance with mock logger
      const firebaseAdminModule = new FirebaseAdminModule(mockLogger);
      const admin = firebaseAdminModule.getAdmin();

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalled();
      expect(admin).toBeDefined(); // Should still return admin namespace
    } finally {
      // Restore original implementation
      mockAdmin.initializeApp = originalInitializeApp;
    }
  });

  it('should call getAdmin only once when called multiple times', async () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'test');

    // Import the module after setting environment variables
    const { FirebaseAdminModule } = await import('../../../lib/firebase-admin');

    // Create instance with mock logger
    const firebaseAdminModule = new FirebaseAdminModule(mockLogger);

    // Call getAdmin multiple times
    const admin1 = firebaseAdminModule.getAdmin();
    const admin2 = firebaseAdminModule.getAdmin();

    // Verify initializeApp was only called once
    expect(mockAdmin.initializeApp).toHaveBeenCalledTimes(1);
    expect(admin1).toBe(admin2);
  });

  it('should create a default logger if none provided', async () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'test');

    // Import the module after setting environment variables
    const { FirebaseAdminModule } = await import('../../../lib/firebase-admin');

    // Create instance without providing a logger
    const firebaseAdminModule = new FirebaseAdminModule();

    // Verify createContextLogger was called
    expect(mockCreateContextLogger).toHaveBeenCalledWith('firebase-admin');
  });
});
