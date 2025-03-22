# Firebase Emulator and Testing Guide

This document outlines how to set up and use the Firebase Local Emulator Suite for development and testing.

## Firebase Local Emulator Suite

The Firebase Local Emulator Suite allows you to run Firebase services locally during development, including:

- Firestore
- Authentication
- Functions
- Storage
- Realtime Database
- Hosting

## Installation and Setup

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Initialize Firebase for your project

If you haven't already initialized Firebase:

```bash
firebase login
firebase init
```

During the initialization process, select the services you want to emulate:
- Firestore
- Authentication
- Functions
- Storage (if needed)

### 3. Configure Emulator Settings

In your `firebase.json` file, configure the emulators section:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

## Running Emulators

### Start the Emulator Suite

```bash
firebase emulators:start
```

This will start all configured emulators and provide a UI accessible at http://localhost:4000 by default.

### Start Specific Emulators

```bash
firebase emulators:start --only auth,firestore
```

## Connecting to Emulators

### Configure your app to use emulators

Create a utility function to connect to emulators in development:

```typescript
// lib/firebase-emulators.ts
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

export function connectToEmulators() {
  // Only connect to emulators in development or test environments
  if (process.env.NODE_ENV === 'production') return;
  
  const auth = getAuth();
  const db = getFirestore();
  const functions = getFunctions();
  const storage = getStorage();
  
  // Connect to emulators
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectStorageEmulator(storage, 'localhost', 9199);
  
  console.log('Connected to Firebase Emulators');
}
```

### Integrate with your app

```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { connectToEmulators } from './firebase-emulators';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators in development/test
if (process.env.NODE_ENV !== 'production') {
  connectToEmulators();
}

export { auth, db };
```

## Testing with Emulators

### Setting up Jest for Firebase Testing

1. Install required packages:

```bash
npm install -D @firebase/rules-unit-testing firebase-admin jest
```

2. Configure Jest for Firebase tests:

```javascript
// jest.config.js
module.exports = {
  // ... other Jest configuration
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/config/firebase-test-setup.js'],
};
```

3. Create setup file:

```javascript
// tests/config/firebase-test-setup.js
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');

// Set up global test environment that can be used in all tests
beforeAll(async () => {
  global.testEnv = await initializeTestEnvironment({
    projectId: 'test-project-id',
    firestore: {
      host: 'localhost',
      port: 8080,
    },
    auth: {
      host: 'localhost',
      port: 9099,
    },
  });
});

// Clean up after all tests
afterAll(async () => {
  await global.testEnv.cleanup();
});
```

### Testing Security Rules

Create test files for your Firestore security rules:

```typescript
// tests/firebase/security-rules.test.ts
import * as testing from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv: testing.RulesTestEnvironment;
  
  beforeAll(async () => {
    testEnv = await testing.initializeTestEnvironment({
      projectId: 'test-project-id',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /users/{userId} {
                allow read: if request.auth != null;
                allow write: if request.auth != null && request.auth.uid == userId;
              }
            }
          }
        `,
      },
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  it('allows authenticated users to read any user profile', async () => {
    // Create an authenticated context
    const authenticatedContext = testEnv.authenticatedContext('user1');
    
    // Try to read a user document that isn't the authenticated user's
    await testing.assertSucceeds(
      authenticatedContext.firestore().collection('users').doc('user2').get()
    );
  });
  
  it('prevents unauthenticated users from reading profiles', async () => {
    // Create an unauthenticated context
    const unauthenticatedContext = testEnv.unauthenticatedContext();
    
    // Try to read a user document
    await testing.assertFails(
      unauthenticatedContext.firestore().collection('users').doc('user1').get()
    );
  });
  
  it('allows users to update their own profiles', async () => {
    // Create an authenticated context
    const authenticatedContext = testEnv.authenticatedContext('user1');
    
    // Try to update the user's own document
    await testing.assertSucceeds(
      authenticatedContext.firestore().collection('users').doc('user1').update({
        name: 'Updated Name',
      })
    );
  });
  
  it('prevents users from updating other users profiles', async () => {
    // Create an authenticated context
    const authenticatedContext = testEnv.authenticatedContext('user1');
    
    // Try to update another user's document
    await testing.assertFails(
      authenticatedContext.firestore().collection('users').doc('user2').update({
        name: 'Unauthorized Update',
      })
    );
  });
});
```

### Running Security Rules Tests

Run your security rules tests with Jest:

```bash
npx jest tests/firebase/security-rules.test.ts
```

### Testing Cloud Functions

Create test files for your Cloud Functions:

```typescript
// tests/firebase/functions.test.ts
import * as testing from '@firebase/rules-unit-testing';
import * as admin from 'firebase-admin';

// Initialize test app
const testApp = admin.initializeApp({
  projectId: 'test-project-id',
});

// Import your functions (adjust the path as needed)
const myFunctions = require('../../functions/index');

describe('Cloud Functions', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await testing.clearFirestoreData({ projectId: 'test-project-id' });
  });
  
  afterAll(async () => {
    await testApp.delete();
  });
  
  it('createUser function creates a user document', async () => {
    // Mock data
    const data = {
      displayName: 'Test User',
      email: 'test@example.com',
    };
    
    // Mock auth context
    const context = {
      auth: {
        uid: 'test-user-id',
        token: {
          email: 'test@example.com',
        },
      },
    };
    
    // Call the function
    await myFunctions.createUser(data, context);
    
    // Verify the result
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc('test-user-id').get();
    
    expect(userDoc.exists).toBe(true);
    expect(userDoc.data()).toEqual({
      displayName: 'Test User',
      email: 'test@example.com',
      createdAt: expect.any(admin.firestore.Timestamp),
    });
  });
  
  it('createUser function rejects unauthenticated requests', async () => {
    // Mock data
    const data = {
      displayName: 'Test User',
      email: 'test@example.com',
    };
    
    // Mock context without auth
    const context = {};
    
    // Expect function to throw an error
    await expect(myFunctions.createUser(data, context))
      .rejects.toThrow(/not authenticated/i);
  });
});
```

## Integration Testing with Cypress

You can set up Cypress for end-to-end testing with Firebase Emulators:

1. Install Cypress:

```bash
npm install -D cypress
```

2. Configure Cypress to connect to Firebase Emulators:

```javascript
// cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.window().then(window => {
    const { auth } = window.firebase;
    return auth.signInWithEmailAndPassword(email, password);
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then(window => {
    const { auth } = window.firebase;
    return auth.signOut();
  });
});

Cypress.Commands.add('seedFirestore', (collection, docId, data) => {
  cy.window().then(window => {
    const { firestore } = window.firebase;
    return firestore.collection(collection).doc(docId).set(data);
  });
});
```

3. Set up the test:

```javascript
// cypress/integration/auth.spec.js
describe('Authentication Flow', () => {
  before(() => {
    // Visit the app connected to emulators
    cy.visit('/');
  });
  
  it('allows a user to log in', () => {
    // Seed a test user into the auth emulator first
    cy.login('test@example.com', 'password');
    
    // Check that the UI reflects logged-in state
    cy.get('[data-testid=user-profile]').should('be.visible');
    cy.get('[data-testid=user-email]').should('contain', 'test@example.com');
  });
  
  it('allows a user to log out', () => {
    // Log in first
    cy.login('test@example.com', 'password');
    
    // Log out
    cy.get('[data-testid=logout-button]').click();
    
    // Check that the UI reflects logged-out state
    cy.get('[data-testid=login-button]').should('be.visible');
  });
});
```

## Data Persistence with Emulators

### Export Emulator Data

```bash
firebase emulators:export ./firebase-emulator-data
```

### Import Emulator Data

```bash
firebase emulators:start --import=./firebase-emulator-data
```

### Seed Initial Test Data

Create a script to seed data for testing:

```typescript
// scripts/seed-emulator.ts
import * as admin from 'firebase-admin';

// Initialize admin SDK for emulator
admin.initializeApp({
  projectId: 'test-project-id',
});

async function seedEmulator() {
  const db = admin.firestore();
  
  // Clear existing data
  await clearCollection(db, 'users');
  
  // Seed users
  const usersRef = db.collection('users');
  await usersRef.doc('user1').set({
    displayName: 'Test User 1',
    email: 'user1@example.com',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  await usersRef.doc('user2').set({
    displayName: 'Test User 2',
    email: 'user2@example.com',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  console.log('Emulator seeded with test data');
}

async function clearCollection(db: admin.firestore.Firestore, collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(deletePromises);
  console.log(`Cleared collection: ${collectionName}`);
}

seedEmulator().catch(console.error);
```

Run the script:

```bash
npx ts-node scripts/seed-emulator.ts
```

## Best Practices

1. **Run Emulators in CI/CD**:
   - Include emulator tests in your continuous integration pipeline
   - Ensure tests run before deploying changes

2. **Maintain Parity with Production**:
   - Keep security rules in sync between emulator and production
   - Use the same schema for Firestore data

3. **Test Edge Cases**:
   - Test with various authentication states
   - Test with malformed data
   - Test permission boundaries

4. **Comprehensive Testing Strategy**:
   - Unit tests for individual components
   - Integration tests for services
   - End-to-end tests for user flows
   - Security rules tests for data access

5. **Environment-Specific Configuration**:
   - Use environment variables to control emulator connection
   - Make it easy to switch between emulators and production

6. **Automate Emulator Setup**:
   - Create npm scripts for common emulator operations
   - Include emulator setup in project documentation

## Npm Scripts for Emulators

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "emulators": "firebase emulators:start",
    "emulators:export": "firebase emulators:export ./firebase-emulator-data",
    "emulators:import": "firebase emulators:start --import=./firebase-emulator-data",
    "emulators:seed": "ts-node scripts/seed-emulator.ts",
    "test:rules": "jest tests/firebase/security-rules.test.ts",
    "test:functions": "jest tests/firebase/functions.test.ts",
    "test:e2e": "start-server-and-test emulators http://localhost:4000 cypress:run",
    "cypress:run": "cypress run"
  }
}
``` 