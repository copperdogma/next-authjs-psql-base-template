/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';

jest.mock('firebase-admin', () => {
  const mockFirestore = jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        set: jest.fn(),
        get: jest.fn(),
      }),
    }),
  });

  return {
    apps: [],
    initializeApp: jest.fn().mockReturnValue({
      firestore: mockFirestore,
    }),
    credential: {
      cert: jest.fn(),
    },
    firestore: mockFirestore,
  };
});

describe('firebase-admin', () => {
  let firebaseAdmin;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  afterEach(() => {
    jest.replaceProperty(process.env, 'NODE_ENV', originalNodeEnv);
  });

  it('should provide the Firebase Admin SDK interface', async () => {
    // Test environment mode
    jest.replaceProperty(process.env, 'NODE_ENV', 'test');

    // Import the module
    firebaseAdmin = (await import('../../../lib/firebase-admin')).default;

    // Basic interface checks
    expect(firebaseAdmin).toBeDefined();
    expect(typeof firebaseAdmin).toBe('object');
    expect(firebaseAdmin.firestore).toBeDefined();
  });

  it('should handle initialization in test environment', async () => {
    // Set test environment
    jest.replaceProperty(process.env, 'NODE_ENV', 'test');

    // Import the module
    firebaseAdmin = (await import('../../../lib/firebase-admin')).default;

    // Just verify it creates a firebase interface
    expect(firebaseAdmin).toBeDefined();
    expect(typeof firebaseAdmin.firestore).toBe('function');
  });
});
