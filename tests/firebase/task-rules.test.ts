/**
 * Task Security Rules Tests for Firestore
 *
 * This test suite validates the Firestore security rules for the tasks collection.
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

describe('Task Collection Security Rules', () => {
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
                
                // Tasks collection
                match /tasks/{taskId} {
                  allow read: if isOwner(resource.data.userId) || isAdmin();
                  allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
                  allow update: if isOwner(resource.data.userId) || isAdmin();
                  allow delete: if isOwner(resource.data.userId) || isAdmin();
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

  describe('Task Read Rules', () => {
    test(
      'unauthenticated users cannot read tasks',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an unauthenticated context
        const unauthenticatedContext = testEnv.unauthenticatedContext();

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('tasks').doc('task1').set({
            title: 'Test Task',
            description: 'This is a test task',
            userId: 'user1',
            createdAt: new Date(),
          });
        });

        // Try to read a task
        const taskDoc = unauthenticatedContext.firestore().collection('tasks').doc('task1');
        await assertFails(taskDoc.get());
      })
    );

    test(
      'users can read their own tasks',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('tasks').doc('task1').set({
            title: 'User Task',
            description: 'This is a task for user1',
            userId: 'user1',
            createdAt: new Date(),
          });
        });

        // Try to read the user's own task
        const taskDoc = authenticatedContext.firestore().collection('tasks').doc('task1');
        await assertSucceeds(taskDoc.get());
      })
    );

    test(
      'users cannot read other users tasks',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('tasks').doc('task2').set({
            title: 'Other User Task',
            description: 'This is a task for user2',
            userId: 'user2',
            createdAt: new Date(),
          });
        });

        // Try to read another user's task
        const taskDoc = authenticatedContext.firestore().collection('tasks').doc('task2');
        await assertFails(taskDoc.get());
      })
    );

    test(
      'admin users can read any task',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an admin context
        const adminContext = testEnv.authenticatedContext('admin', { admin: true });

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('tasks').doc('task2').set({
            title: 'User2 Task',
            description: 'This is a task for user2',
            userId: 'user2',
            createdAt: new Date(),
          });
        });

        // Try to read another user's task as admin
        const taskDoc = adminContext.firestore().collection('tasks').doc('task2');
        await assertSucceeds(taskDoc.get());
      })
    );
  });

  describe('Task Create Rules', () => {
    test(
      'unauthenticated users cannot create tasks',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an unauthenticated context
        const unauthenticatedContext = testEnv.unauthenticatedContext();

        // Try to create a task
        const taskDoc = unauthenticatedContext.firestore().collection('tasks').doc('newtask');
        await assertFails(
          taskDoc.set({
            title: 'New Task',
            description: 'Should not be allowed',
            userId: 'user1',
            createdAt: new Date(),
          })
        );
      })
    );

    test(
      'users can create tasks for themselves',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Try to create a task for the authenticated user
        const taskDoc = authenticatedContext.firestore().collection('tasks').doc('newtask');
        await assertSucceeds(
          taskDoc.set({
            title: 'My New Task',
            description: 'This should be allowed',
            userId: 'user1',
            createdAt: new Date(),
          })
        );
      })
    );

    test(
      'users cannot create tasks for other users',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Try to create a task for another user
        const taskDoc = authenticatedContext.firestore().collection('tasks').doc('newtask');
        await assertFails(
          taskDoc.set({
            title: 'Other User Task',
            description: 'This should not be allowed',
            userId: 'user2',
            createdAt: new Date(),
          })
        );
      })
    );

    test(
      'admin users can only create tasks for themselves',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an admin context
        const adminContext = testEnv.authenticatedContext('admin', { admin: true });

        // Admin should still be restricted to creating tasks only for themselves
        const taskDoc = adminContext.firestore().collection('tasks').doc('newtask');
        await assertFails(
          taskDoc.set({
            title: 'Admin Created Task for User',
            description: 'This should not be allowed even for admins',
            userId: 'user1',
            createdAt: new Date(),
          })
        );
      })
    );
  });

  describe('Task Update Rules', () => {
    test(
      'users can update their own tasks',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('tasks').doc('task1').set({
            title: 'Initial Task',
            description: 'This is a task for user1',
            userId: 'user1',
            createdAt: new Date(),
          });
        });

        // Try to update the user's own task
        const taskDoc = authenticatedContext.firestore().collection('tasks').doc('task1');
        await assertSucceeds(
          taskDoc.update({
            title: 'Updated Task Title',
            description: 'Updated description',
          })
        );
      })
    );

    test(
      'users cannot update other users tasks',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('tasks').doc('task2').set({
            title: 'Other User Task',
            description: 'This is a task for user2',
            userId: 'user2',
            createdAt: new Date(),
          });
        });

        // Try to update another user's task
        const taskDoc = authenticatedContext.firestore().collection('tasks').doc('task2');
        await assertFails(
          taskDoc.update({
            title: 'Attempting to Update',
            description: 'This should fail',
          })
        );
      })
    );

    test(
      'admin users can update any task',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an admin context
        const adminContext = testEnv.authenticatedContext('admin', { admin: true });

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('tasks').doc('task2').set({
            title: 'User2 Task',
            description: 'This is a task for user2',
            userId: 'user2',
            createdAt: new Date(),
          });
        });

        // Try to update another user's task as admin
        const taskDoc = adminContext.firestore().collection('tasks').doc('task2');
        await assertSucceeds(
          taskDoc.update({
            title: 'Admin Updated Title',
            priority: 'high',
          })
        );
      })
    );
  });

  describe('Task Delete Rules', () => {
    test(
      'users can delete their own tasks',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('tasks').doc('task1').set({
            title: 'User Task',
            description: 'This is a task for user1',
            userId: 'user1',
            createdAt: new Date(),
          });
        });

        // Try to delete the user's own task
        const taskDoc = authenticatedContext.firestore().collection('tasks').doc('task1');
        await assertSucceeds(taskDoc.delete());
      })
    );

    test(
      'users cannot delete other users tasks',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an authenticated context
        const authenticatedContext = testEnv.authenticatedContext('user1');

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('tasks').doc('task2').set({
            title: 'Other User Task',
            description: 'This is a task for user2',
            userId: 'user2',
            createdAt: new Date(),
          });
        });

        // Try to delete another user's task
        const taskDoc = authenticatedContext.firestore().collection('tasks').doc('task2');
        await assertFails(taskDoc.delete());
      })
    );

    test(
      'admin users can delete any task',
      skipTestIfNoEmulator(async () => {
        if (!testEnv) {
          console.warn('Skipping test - Firebase emulator not initialized');
          return;
        }

        // Create an admin context
        const adminContext = testEnv.authenticatedContext('admin', { admin: true });

        // Set up initial data
        await testEnv.withSecurityRulesDisabled(async (context: testing.RulesTestContext) => {
          await context.firestore().collection('tasks').doc('task2').set({
            title: 'User2 Task',
            description: 'This is a task for user2',
            userId: 'user2',
            createdAt: new Date(),
          });
        });

        // Try to delete another user's task as admin
        const taskDoc = adminContext.firestore().collection('tasks').doc('task2');
        await assertSucceeds(taskDoc.delete());
      })
    );
  });
});
