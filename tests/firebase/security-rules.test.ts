/**
 * Security Rules Tests for Firestore
 *
 * This test suite validates the Firestore security rules for various collections.
 */

import * as testing from '@firebase/rules-unit-testing';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

const PROJECT_ID = 'test-project';

// Skip test if emulator is not running
const skipTestIfNoEmulator = (testFn: () => Promise<void>) => {
  return async () => {
    try {
      await testFn();
    } catch (error: unknown) {
      if ((error as Error).message?.includes('Firebase emulator not running')) {
        console.warn('Skipping test - Firebase emulator not running');
        return;
      }
      throw error;
    }
  };
};

describe('Firestore Security Rules', () => {
  let testEnv: testing.RulesTestEnvironment | undefined;

  // Set up the test environment with security rules
  beforeAll(async () => {
    try {
      testEnv = await testing.initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
          rules: `
            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                // Helper functions
                function isSignedIn() {
                  return request.auth != null;
                }
                
                function isOwner(userId) {
                  return isSignedIn() && request.auth.uid == userId;
                }
                
                function isAdmin() {
                  return isSignedIn() && request.auth.token.admin == true;
                }
                
                // Default deny rule
                match /{document=**} {
                  allow read, write: if false;
                }
                
                // Users collection
                match /users/{userId} {
                  allow create: if isSignedIn() && request.auth.uid == userId;
                  allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
                  allow update: if isSignedIn() && request.auth.uid == userId;
                  allow delete: if isAdmin();
                }
                
                // Public collection
                match /public/{docId} {
                  allow read: if true;
                  allow create, update, delete: if isAdmin();
                }
              }
            }
          `,
        },
      });
    } catch (error: unknown) {
      console.warn('Failed to initialize Firebase test environment:', (error as Error).message);
      // Test will be skipped in the test functions
    }
  });

  // Clean up after all tests
  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  // Clear the database between tests
  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  describe('User Collection Rules', () => {
    test(
      'unauthenticated users cannot read user profiles',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an unauthenticated context
        const unauthenticatedContext = testEnv.unauthenticatedContext();

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('users').doc('user1').set({
            displayName: 'Test User',
            email: 'user1@example.com',
            role: 'user',
            createdAt: new Date(),
          });
        });

        // Try to read a user profile
        const userDoc = unauthenticatedContext.firestore().collection('users').doc('user1');
        await assertFails(userDoc.get());
      })
    );

    test(
      'authenticated users can read their own profile',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('users').doc('user1').set({
            displayName: 'Test User',
            email: 'user1@example.com',
            role: 'user',
            createdAt: new Date(),
          });
        });

        // Try to read the user's own profile
        const userDoc = authenticatedContext.firestore().collection('users').doc('user1');
        await assertSucceeds(userDoc.get());
      })
    );

    test(
      'authenticated users cannot read other user profiles',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('users').doc('user2').set({
            displayName: 'Other User',
            email: 'user2@example.com',
            role: 'user',
            createdAt: new Date(),
          });
        });

        // Try to read another user's profile
        const userDoc = authenticatedContext.firestore().collection('users').doc('user2');
        await assertFails(userDoc.get());
      })
    );

    test(
      'admin users can read any user profile',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an admin context
        const adminContext = testEnv.authenticatedContext('admin', { admin: true });

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('users').doc('user2').set({
            displayName: 'Other User',
            email: 'user2@example.com',
            role: 'user',
            createdAt: new Date(),
          });
        });

        // Try to read another user's profile as admin
        const userDoc = adminContext.firestore().collection('users').doc('user2');
        await assertSucceeds(userDoc.get());
      })
    );

    test(
      'unauthenticated users cannot create user profiles',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an unauthenticated context
        const unauthenticatedContext = testEnv.unauthenticatedContext();

        // Try to create a user profile
        const userDoc = unauthenticatedContext.firestore().collection('users').doc('user1');
        await assertFails(
          userDoc.set({
            displayName: 'Test User',
            email: 'user1@example.com',
            role: 'user',
            createdAt: new Date(),
          })
        );
      })
    );

    test(
      'authenticated users can create their own profile',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Try to create the user's own profile
        const userDoc = authenticatedContext.firestore().collection('users').doc('user1');
        await assertSucceeds(
          userDoc.set({
            displayName: 'Test User',
            email: 'user1@example.com',
            role: 'user',
            createdAt: new Date(),
          })
        );
      })
    );

    test(
      'authenticated users cannot create profiles for other users',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Try to create a profile for another user
        const userDoc = authenticatedContext.firestore().collection('users').doc('user2');
        await assertFails(
          userDoc.set({
            displayName: 'Other User',
            email: 'user2@example.com',
            role: 'user',
            createdAt: new Date(),
          })
        );
      })
    );
  });

  describe('Public Collection Rules', () => {
    test(
      'unauthenticated users can read public documents',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an unauthenticated context
        const unauthenticatedContext = testEnv.unauthenticatedContext();

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('public').doc('doc1').set({
            title: 'Public Information',
            content: 'This is available to all users',
            type: 'info',
            createdAt: new Date(),
          });
        });

        // Try to read a public document
        const publicDoc = unauthenticatedContext.firestore().collection('public').doc('doc1');
        await assertSucceeds(publicDoc.get());
      })
    );

    test(
      'unauthenticated users cannot write to public documents',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an unauthenticated context
        const unauthenticatedContext = testEnv.unauthenticatedContext();

        // Try to create a public document
        const publicDoc = unauthenticatedContext.firestore().collection('public').doc('doc2');
        await assertFails(
          publicDoc.set({
            title: 'Unauthorized Public Document',
            content: 'This should not be allowed',
            type: 'info',
            createdAt: new Date(),
          })
        );
      })
    );

    test(
      'non-admin authenticated users cannot write to public documents',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context (non-admin)
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Try to create a public document
        const publicDoc = authenticatedContext.firestore().collection('public').doc('doc2');
        await assertFails(
          publicDoc.set({
            title: 'User Created Public Document',
            content: 'This should not be allowed',
            type: 'info',
            createdAt: new Date(),
          })
        );
      })
    );

    test(
      'admin users can write to public documents',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an admin context
        const adminContext = testEnv.authenticatedContext('admin', { admin: true });

        // Try to create a public document as admin
        const publicDoc = adminContext.firestore().collection('public').doc('doc2');
        await assertSucceeds(
          publicDoc.set({
            title: 'Admin Created Public Document',
            content: 'This should be allowed',
            type: 'announcement',
            createdAt: new Date(),
          })
        );
      })
    );
  });

  describe('Default Deny Rules', () => {
    test(
      'accessing an undefined collection is denied',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Try to access a document in an undefined collection
        const randomDoc = authenticatedContext.firestore().collection('random').doc('some-doc');
        await assertFails(randomDoc.get());
      })
    );
  });
});
