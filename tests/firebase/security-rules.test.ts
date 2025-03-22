/**
 * Security rules tests for Firestore
 * 
 * This test suite validates the Firestore security rules implemented in the application.
 * It uses the Firebase rules testing library to test various access patterns.
 */

import * as testing from '@firebase/rules-unit-testing';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

const PROJECT_ID = 'test-project';

describe('Firestore Security Rules', () => {
  let testEnv: testing.RulesTestEnvironment;
  
  // Set up the test environment with security rules
  beforeAll(async () => {
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
              
              // User profiles
              match /users/{userId} {
                allow read: if isSignedIn();
                allow create: if isOwner(userId);
                allow update: if isOwner(userId) || isAdmin();
                allow delete: if isAdmin();
              }
              
              // Public data
              match /public/{document=**} {
                allow read: if true;
                allow write: if isAdmin();
              }
            }
          }
        `,
      },
    });
  });
  
  // Clean up after all tests
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  // Clear the database between tests
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });
  
  describe('User Collection Rules', () => {
    test('unauthenticated users cannot read user profiles', async () => {
      // Create an unauthenticated context
      const unauthenticatedContext = testEnv.unauthenticatedContext();
      
      // Try to read a user document
      const userDoc = unauthenticatedContext.firestore().collection('users').doc('user1');
      await assertFails(userDoc.get());
    });
    
    test('authenticated users can read any user profile', async () => {
      // Create an authenticated context
      const authenticatedContext = testEnv.authenticatedContext('user1');
      
      // Try to read a different user's document
      const otherUserDoc = authenticatedContext.firestore().collection('users').doc('user2');
      await assertSucceeds(otherUserDoc.get());
    });
    
    test('users can create their own profile', async () => {
      // Create an authenticated context
      const authenticatedContext = testEnv.authenticatedContext('user1');
      
      // Try to create the user's own document
      const userDoc = authenticatedContext.firestore().collection('users').doc('user1');
      await assertSucceeds(userDoc.set({
        displayName: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
      }));
    });
    
    test('users cannot create other users profiles', async () => {
      // Create an authenticated context
      const authenticatedContext = testEnv.authenticatedContext('user1');
      
      // Try to create another user's document
      const otherUserDoc = authenticatedContext.firestore().collection('users').doc('user2');
      await assertFails(otherUserDoc.set({
        displayName: 'Other User',
        email: 'other@example.com',
        createdAt: new Date(),
      }));
    });
    
    test('users can update their own profile', async () => {
      // Create an authenticated context
      const authenticatedContext = testEnv.authenticatedContext('user1');
      
      // Set up initial data
      const userDoc = authenticatedContext.firestore().collection('users').doc('user1');
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user1').set({
          displayName: 'Initial Name',
          email: 'test@example.com',
          createdAt: new Date(),
        });
      });
      
      // Try to update the user's own document
      await assertSucceeds(userDoc.update({
        displayName: 'Updated Name',
      }));
    });
    
    test('users cannot update other users profiles', async () => {
      // Create an authenticated context
      const authenticatedContext = testEnv.authenticatedContext('user1');
      
      // Set up initial data
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user2').set({
          displayName: 'Other User',
          email: 'other@example.com',
          createdAt: new Date(),
        });
      });
      
      // Try to update another user's document
      const otherUserDoc = authenticatedContext.firestore().collection('users').doc('user2');
      await assertFails(otherUserDoc.update({
        displayName: 'Hacked Name',
      }));
    });
    
    test('admin users can update any user profile', async () => {
      // Create an admin context
      const adminContext = testEnv.authenticatedContext('admin', { admin: true });
      
      // Set up initial data
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user1').set({
          displayName: 'Regular User',
          email: 'user@example.com',
          createdAt: new Date(),
        });
      });
      
      // Try to update another user's document as admin
      const userDoc = adminContext.firestore().collection('users').doc('user1');
      await assertSucceeds(userDoc.update({
        displayName: 'Admin Updated Name',
        role: 'premium',
      }));
    });
    
    test('regular users cannot delete any profile', async () => {
      // Create an authenticated context
      const authenticatedContext = testEnv.authenticatedContext('user1');
      
      // Set up initial data
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user1').set({
          displayName: 'Test User',
          email: 'test@example.com',
        });
      });
      
      // Try to delete the user's own document
      const userDoc = authenticatedContext.firestore().collection('users').doc('user1');
      await assertFails(userDoc.delete());
    });
    
    test('admin users can delete any profile', async () => {
      // Create an admin context
      const adminContext = testEnv.authenticatedContext('admin', { admin: true });
      
      // Set up initial data
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user1').set({
          displayName: 'Test User',
          email: 'test@example.com',
        });
      });
      
      // Try to delete a user document as admin
      const userDoc = adminContext.firestore().collection('users').doc('user1');
      await assertSucceeds(userDoc.delete());
    });
  });
  
  describe('Public Collection Rules', () => {
    test('anyone can read public documents', async () => {
      // Create an unauthenticated context
      const unauthenticatedContext = testEnv.unauthenticatedContext();
      
      // Set up initial data
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('public').doc('announcement').set({
          title: 'Public Announcement',
          content: 'This is a public announcement',
        });
      });
      
      // Try to read a public document
      const publicDoc = unauthenticatedContext.firestore().collection('public').doc('announcement');
      await assertSucceeds(publicDoc.get());
    });
    
    test('regular users cannot write to public documents', async () => {
      // Create an authenticated context
      const authenticatedContext = testEnv.authenticatedContext('user1');
      
      // Try to write to a public document
      const publicDoc = authenticatedContext.firestore().collection('public').doc('announcement');
      await assertFails(publicDoc.set({
        title: 'User Created Announcement',
        content: 'This should not be allowed',
      }));
    });
    
    test('admin users can write to public documents', async () => {
      // Create an admin context
      const adminContext = testEnv.authenticatedContext('admin', { admin: true });
      
      // Try to write to a public document as admin
      const publicDoc = adminContext.firestore().collection('public').doc('announcement');
      await assertSucceeds(publicDoc.set({
        title: 'Admin Created Announcement',
        content: 'This should be allowed',
        createdAt: new Date(),
      }));
    });
  });
  
  describe('Default Deny Rule', () => {
    test('accessing an undefined collection is denied', async () => {
      // Create an authenticated context
      const authenticatedContext = testEnv.authenticatedContext('user1');
      
      // Try to access a collection not defined in rules
      const secretDoc = authenticatedContext.firestore().collection('secrets').doc('topsecret');
      await assertFails(secretDoc.get());
    });
    
    test('admin users also cannot access undefined collections', async () => {
      // Create an admin context
      const adminContext = testEnv.authenticatedContext('admin', { admin: true });
      
      // Try to access a collection not defined in rules as admin
      const secretDoc = adminContext.firestore().collection('secrets').doc('topsecret');
      await assertFails(secretDoc.get());
    });
  });
}); 