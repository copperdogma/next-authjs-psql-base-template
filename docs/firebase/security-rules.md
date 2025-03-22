# Firebase Security Rules

This document outlines the best practices for implementing Firebase security rules in our application.

## Security Rules Overview

Firebase Security Rules define who has access to your data and how they can access it. Proper implementation is critical for maintaining application security.

## Firestore Security Rules

### Basic Structure

Security rules for Firestore follow this structure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rules go here
  }
}
```

### Best Practices

1. **Default Deny**: Always start with denying all access by default
   ```javascript
   match /{document=**} {
     allow read, write: if false;
   }
   ```

2. **User-Based Authentication**: Ensure users can only access their own data
   ```javascript
   match /users/{userId} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```

3. **Data Validation**: Validate all incoming data
   ```javascript
   match /posts/{postId} {
     allow create: if request.auth != null 
                  && request.resource.data.userId == request.auth.uid
                  && request.resource.data.title.size() > 0
                  && request.resource.data.content.size() > 0;
   }
   ```

4. **Use Function Composition**: Extract common logic into reusable functions
   ```javascript
   function isSignedIn() {
     return request.auth != null;
   }
   
   function isOwner(userId) {
     return isSignedIn() && request.auth.uid == userId;
   }
   
   match /users/{userId} {
     allow read, write: if isOwner(userId);
   }
   ```

5. **Custom Claims**: Leverage custom claims for role-based access
   ```javascript
   function isAdmin() {
     return request.auth != null && request.auth.token.admin == true;
   }
   
   match /admin/{document=**} {
     allow read, write: if isAdmin();
   }
   ```

6. **Data Access Constraints**: Limit which fields can be updated
   ```javascript
   match /users/{userId} {
     allow update: if isOwner(userId)
                  && request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['displayName', 'photoURL']);
   }
   ```

## Testing Security Rules

### Emulator Testing

1. Install Firebase Emulator Suite:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize emulators:
   ```bash
   firebase init emulators
   ```

3. Create test file: `tests/firebase/security-rules.test.ts`

4. Example test:
   ```typescript
   import * as firebase from '@firebase/rules-unit-testing';
   
   describe('Firestore Security Rules', () => {
     let projectId = 'test-project';
     let adminApp: firebase.RulesTestContext;
     let userApp: firebase.RulesTestContext;
     
     beforeAll(async () => {
       adminApp = firebase.initializeTestApp({
         projectId,
         auth: { uid: 'admin', token: { admin: true } }
       });
       
       userApp = firebase.initializeTestApp({
         projectId,
         auth: { uid: 'user123' }
       });
     });
     
     afterAll(async () => {
       await firebase.clearFirestoreData({ projectId });
       await Promise.all(firebase.apps().map(app => app.delete()));
     });
     
     test('users can read their own profile', async () => {
       const db = userApp.firestore();
       const profile = db.collection('users').doc('user123');
       await firebase.assertSucceeds(profile.get());
     });
     
     test('users cannot read other users profiles', async () => {
       const db = userApp.firestore();
       const otherProfile = db.collection('users').doc('other-user');
       await firebase.assertFails(otherProfile.get());
     });
   });
   ```

5. Run tests with emulator:
   ```bash
   firebase emulators:exec "jest tests/firebase/security-rules.test.ts"
   ```

## Server-Side Validation

While security rules provide client-side protection, always validate data on the server side as well:

1. **API Endpoints**: All API endpoints should validate incoming data
   ```typescript
   // Example with Zod validation
   import { z } from 'zod';
   
   const userSchema = z.object({
     displayName: z.string().min(2).max(100),
     email: z.string().email(),
     // other fields
   });
   
   export async function POST(request: Request) {
     try {
       const data = await request.json();
       const validatedData = userSchema.parse(data);
       
       // Process validated data
     } catch (error) {
       // Handle validation errors
     }
   }
   ```

2. **Admin SDK**: Use Admin SDK for critical operations, bypassing security rules
   ```typescript
   import { getFirestore } from 'firebase-admin/firestore';
   
   export async function updateUserRole(userId: string, role: string) {
     const db = getFirestore();
     await db.collection('users').doc(userId).update({ role });
   }
   ```

## Example Security Rules for This Project

```javascript
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
```

## Deployment

Deploy security rules using the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

Or include rules in your CI/CD pipeline for automatic deployment. 