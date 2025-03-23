# Firebase Performance Optimization

This document outlines best practices for optimizing Firebase performance in the application.

## SDK Lazy Loading

To minimize bundle size and improve application load time, implement lazy loading for Firebase SDK:

### Current Implementation

Our implementation in `lib/firebase.ts` already uses conditional imports and initialization:

```typescript
// Only initialize Firebase on the client side
if (typeof window !== 'undefined') {
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(firebaseApp);
} else {
  // Provide placeholders for SSR context that won't be used
  auth = {};
  firebaseApp = undefined;
}
```

### Further Optimization with Dynamic Imports

For components that don't immediately need Firebase, consider using dynamic imports:

```typescript
// Example of lazy loading Firebase in a component
import { useState, useEffect } from 'react';

function FirebaseComponent() {
  const [firebaseAuth, setFirebaseAuth] = useState(null);

  useEffect(() => {
    const loadFirebase = async () => {
      const { auth } = await import('../lib/firebase');
      setFirebaseAuth(auth);
    };

    loadFirebase();
  }, []);

  // Use firebaseAuth when it's available
  return (
    <div>
      {firebaseAuth ? "Firebase loaded" : "Loading Firebase..."}
    </div>
  );
}
```

## Efficient Firestore Queries

### Use Proper Indexing

1. Create indexes for frequently used queries:

   ```javascript
   // Example of a compound query that would need an index
   db.collection('posts').where('authorId', '==', userId).orderBy('createdAt', 'desc').limit(10);
   ```

2. Add composite indexes for fields queried together:
   ```javascript
   // Example Firebase indexes.json
   {
     "indexes": [
       {
         "collectionGroup": "posts",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "authorId", "order": "ASCENDING" },
           { "fieldPath": "createdAt", "order": "DESCENDING" }
         ]
       }
     ]
   }
   ```

### Query Optimization Techniques

1. **Use Limits**: Always limit query results

   ```typescript
   const query = db.collection('posts').limit(20);
   ```

2. **Pagination**: Use cursor-based pagination instead of offset

   ```typescript
   // First query
   const first = await db.collection('posts').orderBy('createdAt').limit(10).get();

   // Get the last document
   const lastDoc = first.docs[first.docs.length - 1];

   // Next page query
   const next = await db
     .collection('posts')
     .orderBy('createdAt')
     .startAfter(lastDoc)
     .limit(10)
     .get();
   ```

3. **Select Specific Fields**: Use select() to retrieve only needed fields

   ```typescript
   db.collection('users').doc(userId).select(['name', 'email']).get();
   ```

4. **Hierarchical Data**: Use sub-collections for hierarchical data

   ```typescript
   // Example structure
   users / { userId } / posts / { postId };
   ```

5. **Denormalization**: For frequently accessed data, consider denormalization
   ```typescript
   // Example of denormalized data
   users/{userId} = {
     name: 'User Name',
     recentPosts: [
       { id: 'post1', title: 'Post 1', summary: '...' },
       { id: 'post2', title: 'Post 2', summary: '...' }
     ]
   }
   ```

## Cloud Functions Optimization

### Cold Start Optimization

1. **Use Initialization Outside Handler**: Move initialization code outside the function handler

   ```typescript
   // Import and initialize outside the function
   import { db } from './shared-db';

   export const myFunction = functions.https.onCall((data, context) => {
     // Function logic using already initialized db
   });
   ```

2. **Memory Allocation**: Adjust memory allocation based on function needs

   ```typescript
   export const myFunction = functions
     .runWith({
       memory: '256MB', // Adjust based on needs
       timeoutSeconds: 60,
     })
     .https.onCall((data, context) => {
       // Function logic
     });
   ```

3. **Function Bundling**: Group related functions together to share initialization

   ```typescript
   // user-functions.js - all user-related functions bundled
   export const createUser = functions.https.onCall(/* ... */);
   export const updateUser = functions.https.onCall(/* ... */);
   export const deleteUser = functions.https.onCall(/* ... */);
   ```

4. **Use Node.js Versions**: Use recent Node.js versions for better performance
   ```json
   {
     "engines": {
       "node": "18"
     }
   }
   ```

### Function Implementation Best Practices

1. **Batched Operations**: Use batched writes for multiple operations

   ```typescript
   const batch = db.batch();

   // Add operations to batch
   batch.set(doc1Ref, data1);
   batch.update(doc2Ref, data2);
   batch.delete(doc3Ref);

   // Commit as a single transaction
   await batch.commit();
   ```

2. **Transactions**: Use transactions for reads and writes that depend on each other

   ```typescript
   await db.runTransaction(async transaction => {
     const docRef = db.collection('counters').doc('likes');
     const doc = await transaction.get(docRef);

     if (!doc.exists) {
       transaction.set(docRef, { count: 1 });
     } else {
       const newCount = doc.data().count + 1;
       transaction.update(docRef, { count: newCount });
     }
   });
   ```

3. **Function Composition**: Break functions into smaller, reusable pieces

   ```typescript
   // Helper function
   const validateUser = user => {
     // Validation logic
   };

   // Main function
   export const createUser = functions.https.onCall((data, context) => {
     const validationResult = validateUser(data);

     if (!validationResult.valid) {
       throw new functions.https.HttpsError('invalid-argument', validationResult.error);
     }

     // Create user logic
   });
   ```

## Monitoring and Metrics

To ensure optimal performance:

1. **Firebase Performance Monitoring**: Implement Firebase Performance Monitoring

   ```typescript
   import { getPerformance } from 'firebase/performance';

   // Initialize Performance Monitoring
   const perf = getPerformance(firebaseApp);
   ```

2. **Custom Traces**: Add custom traces for critical operations

   ```typescript
   import { trace } from 'firebase/performance';

   // Start a trace
   const customTrace = trace(perf, 'custom_trace_name');
   customTrace.start();

   // Add custom metrics
   customTrace.putMetric('data_size', dataSize);

   // Do the operation you want to trace
   await performOperation();

   // Stop the trace
   customTrace.stop();
   ```

3. **Monitor HTTP Requests**: Automatically track HTTP request performance
   ```typescript
   // Firebase Performance automatically tracks HTTP requests
   // Make sure the Performance Monitoring SDK is initialized before making requests
   ```

## Testing with Emulator Suite

For faster development and testing:

1. **Install Firebase Emulator Suite**:

   ```bash
   npm install -g firebase-tools
   firebase setup:emulators:firestore
   firebase setup:emulators:functions
   ```

2. **Configure Emulator Ports**:

   ```json
   // firebase.json
   {
     "emulators": {
       "firestore": {
         "port": 8080
       },
       "functions": {
         "port": 5001
       },
       "auth": {
         "port": 9099
       }
     }
   }
   ```

3. **Connect Application to Emulators**:

   ```typescript
   // lib/firebase.ts - add in development mode
   if (process.env.NODE_ENV === 'development') {
     // Connect to emulators
     import { connectAuthEmulator } from 'firebase/auth';
     import { connectFirestoreEmulator } from 'firebase/firestore';

     connectAuthEmulator(auth, 'http://localhost:9099');
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

4. **Run Emulators**:
   ```bash
   firebase emulators:start
   ```
