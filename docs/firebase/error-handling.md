# Firebase Error Handling & Monitoring

This document outlines best practices for handling errors and implementing monitoring for Firebase services.

## Error Handling Best Practices

### Client-Side Error Handling

1. **Authentication Errors**: Implement specific error handling for different authentication error codes
   ```typescript
   import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
   
   try {
     await signInWithEmailAndPassword(auth, email, password);
   } catch (error) {
     const authError = error as AuthError;
     
     switch (authError.code) {
       case 'auth/invalid-email':
         // Handle invalid email
         break;
       case 'auth/user-disabled':
         // Handle disabled user
         break;
       case 'auth/user-not-found':
         // Handle user not found
         break;
       case 'auth/wrong-password':
         // Handle wrong password
         break;
       default:
         // Handle other errors
         console.error('Authentication error:', authError);
     }
   }
   ```

2. **Firestore Errors**: Handle database operation errors
   ```typescript
   try {
     await db.collection('users').doc(userId).update({ name: 'New Name' });
   } catch (error) {
     if (error.code === 'permission-denied') {
       // Handle permission denied
     } else if (error.code === 'not-found') {
       // Handle document not found
     } else {
       // Handle other errors
       console.error('Firestore error:', error);
     }
   }
   ```

3. **Network Error Handling**: Implement offline detection and retry logic
   ```typescript
   import { onAuthStateChanged } from 'firebase/auth';
   import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
   
   // Check if online/offline
   window.addEventListener('online', () => {
     const db = getFirestore();
     enableNetwork(db);
   });
   
   window.addEventListener('offline', () => {
     const db = getFirestore();
     disableNetwork(db);
   });
   ```

### Server-Side Error Handling

1. **Admin SDK Errors**: Implement comprehensive error handling for Admin SDK operations
   ```typescript
   try {
     await admin.auth().setCustomUserClaims(uid, { admin: true });
   } catch (error) {
     if (error.code === 'auth/user-not-found') {
       // Handle user not found
     } else {
       // Log detailed error information
       console.error('Admin SDK error:', {
         code: error.code,
         message: error.message,
         stack: error.stack
       });
     }
   }
   ```

2. **Cloud Functions Error Handling**: Use proper error codes for Cloud Functions
   ```typescript
   import * as functions from 'firebase-functions';
   
   export const createUser = functions.https.onCall((data, context) => {
     // Check if the user is authenticated
     if (!context.auth) {
       throw new functions.https.HttpsError(
         'unauthenticated',
         'You must be logged in to create a user.'
       );
     }
     
     // Check if the data is valid
     if (!data.name || data.name.length < 3) {
       throw new functions.https.HttpsError(
         'invalid-argument',
         'Name must be at least 3 characters long.'
       );
     }
     
     // Create user logic...
   });
   ```

## React Error Boundaries

Implement React Error Boundaries to prevent the entire application from crashing when Firebase operations fail:

```tsx
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to your monitoring service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // You could also send this to Firebase Crashlytics
    // crashlytics().recordError(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>Please try again later or contact support.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Usage example:

```tsx
// In your component
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <FirebaseAuthComponent />
    </ErrorBoundary>
  );
}
```

## Firebase Crashlytics Setup

Implement Firebase Crashlytics to track errors in production:

### Installation

1. Add the Crashlytics package:
   ```bash
   npm install @firebase/crashlytics
   ```

2. Initialize Crashlytics:
   ```typescript
   // lib/firebase.ts - add to client-side initialization
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   import { getAnalytics } from 'firebase/analytics';
   import { getPerformance } from 'firebase/performance';
   import { initializeCrashlytics } from 'firebase/crashlytics';
   
   // Initialize Firebase
   const app = initializeApp(firebaseConfig);
   
   // Initialize services
   const auth = getAuth(app);
   const db = getFirestore(app);
   const analytics = getAnalytics(app);
   const performance = getPerformance(app);
   const crashlytics = initializeCrashlytics(app);
   ```

### Capturing Errors

1. Manual error logging:
   ```typescript
   import { logEvent } from 'firebase/crashlytics';
   
   try {
     // Risky operation
   } catch (error) {
     // Log the error to Crashlytics
     logEvent(crashlytics, 'custom_error', { 
       source: 'paymentProcessing',
       userId: currentUser.uid,
       errorDetails: error.message
     });
     
     // Rethrow or handle as needed
     throw error;
   }
   ```

2. Set user identifiers for better error tracking:
   ```typescript
   import { setUserId, setCustomKey } from 'firebase/crashlytics';
   
   // When user logs in
   onAuthStateChanged(auth, (user) => {
     if (user) {
       // Set user information in Crashlytics
       setUserId(crashlytics, user.uid);
       setCustomKey(crashlytics, 'email', user.email || 'no-email');
       setCustomKey(crashlytics, 'accountType', user.emailVerified ? 'verified' : 'unverified');
     }
   });
   ```

## Performance Monitoring

### Setup Firebase Performance Monitoring

1. Install Performance Monitoring:
   ```bash
   npm install @firebase/performance
   ```

2. Initialize Performance Monitoring:
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getPerformance } from 'firebase/performance';
   
   const app = initializeApp(firebaseConfig);
   const perf = getPerformance(app);
   ```

### Custom Performance Monitoring

1. Track critical operations with custom traces:
   ```typescript
   import { trace } from 'firebase/performance';
   
   async function loadUserData(userId: string) {
     // Start a performance trace
     const userDataTrace = trace(perf, 'load_user_data');
     userDataTrace.start();
     
     try {
       // Add custom metrics
       userDataTrace.putAttribute('userId', userId);
       
       // Perform operation
       const userData = await fetchUserData(userId);
       
       // Add result metrics
       userDataTrace.putMetric('data_size', JSON.stringify(userData).length);
       
       return userData;
     } finally {
       // Always stop the trace
       userDataTrace.stop();
     }
   }
   ```

2. Trace HTTP requests:
   ```typescript
   import { getPerformance, trace } from 'firebase/performance';
   
   const perf = getPerformance();
   
   async function fetchWithPerf(url: string, options?: RequestInit) {
     const fetchTrace = trace(perf, 'custom_fetch');
     fetchTrace.start();
     
     fetchTrace.putAttribute('url', url);
     
     try {
       const response = await fetch(url, options);
       const data = await response.json();
       
       fetchTrace.putMetric('response_size', JSON.stringify(data).length);
       fetchTrace.putMetric('status_code', response.status);
       
       return data;
     } catch (error) {
       fetchTrace.putAttribute('error', error.message);
       throw error;
     } finally {
       fetchTrace.stop();
     }
   }
   ```

## Monitoring Dashboard Setup

To get the most value from Firebase monitoring:

1. **Set Up Alerts**:
   - Configure performance threshold alerts
   - Set up error rate notifications
   - Create custom alerts for critical metrics

2. **Custom Dashboards**:
   - Create custom dashboards for key metrics
   - Add critical performance traces
   - Track authentication failures

3. **Monitor Cloud Functions**:
   - Track cold starts
   - Monitor execution times
   - Set up billing alerts

## Testing Error Handling

### Unit Testing Error Handlers

```typescript
// Example Jest test for error handling
import { handleAuthError } from '../utils/error-handlers';

describe('Auth Error Handler', () => {
  test('handles invalid email error', () => {
    const error = { code: 'auth/invalid-email', message: 'Invalid email' };
    const result = handleAuthError(error);
    
    expect(result).toEqual({
      field: 'email',
      message: 'Please enter a valid email address'
    });
  });
  
  test('handles wrong password error', () => {
    const error = { code: 'auth/wrong-password', message: 'Wrong password' };
    const result = handleAuthError(error);
    
    expect(result).toEqual({
      field: 'password',
      message: 'Incorrect password'
    });
  });
});
```

### Integration Testing with Error Simulation

```typescript
// Using Firebase Emulator Suite to test error scenarios
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
  });
});

test('handles permission denied errors', async () => {
  // Set up user without permissions
  const unauthedDb = testEnv.unauthenticatedContext().firestore();
  
  // Attempt operation that should fail
  await expect(
    unauthedDb.collection('restricted').doc('secret').get()
  ).rejects.toThrow('permission-denied');
  
  // Verify error handling in your application
  // ...
});
```

## Error Handling Strategy Summary

1. **Implement specific error handlers** for different error types
2. **Use Error Boundaries** to prevent app crashes
3. **Implement Crashlytics** for production error tracking
4. **Set up Performance Monitoring** for critical operations
5. **Create comprehensive test coverage** for error scenarios
6. **Document common errors** and their solutions 