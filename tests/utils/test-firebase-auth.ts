/**
 * Firebase client authentication utilities for E2E tests
 *
 * This file provides a script that can be injected into the page during
 * E2E tests to handle authentication with Firebase client SDK.
 */

// Define types for authentication result
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthError {
  message: string;
  code: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: AuthError;
}

/**
 * Creates a script to be injected into the page for signing in with a custom token
 */
export function createAuthScript(customToken: string): string {
  return `(async () => {
    try {
      // Dynamically load the Firebase SDK script
      const loadScript = (url) => {
        return new Promise((resolve, reject) => {
          if (document.querySelector(\`script[src="\${url}"]\`)) {
            resolve();
            return;
          }
          
          const script = document.createElement('script');
          script.src = url;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };
      
      // Check for Firebase SDK
      if (!window.firebase) {
        console.log('Loading Firebase SDK...');
        await loadScript('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js');
      }
      
      // Initialize Firebase if not already initialized
      if (!window.firebase.apps.length) {
        // Firebase configuration
        const firebaseConfig = {
          apiKey: 'test-api-key',
          authDomain: 'localhost',
          projectId: 'test-project',
        };
        
        window.firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized');
      }
      
      // Get auth instance
      const auth = window.firebase.auth();
      
      // Connect to emulator if needed
      if (window.location.hostname === 'localhost') {
        try {
          auth.useEmulator('http://localhost:9099');
          console.log('Connected to Firebase Auth emulator');
        } catch (e) {
          console.log('Emulator connection error (ignoring):', e);
        }
      }
      
      // Sign in with the custom token
      console.log('Signing in with custom token...');
      const userCredential = await auth.signInWithCustomToken('${customToken}');
      console.log('Sign in successful');
      
      // Return user info
      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
        }
      };
    } catch (error) {
      console.error('Error signing in with custom token:', error);
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'unknown'
        }
      };
    }
  })()`;
}
