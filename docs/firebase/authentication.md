# Firebase Authentication Documentation

This document outlines the authentication flow and best practices for our application using Firebase Authentication.

## Authentication Flow

The application uses Firebase Authentication for user management, with the following features:

1. Sign in with Google (OAuth provider)
2. Session management with HTTP-only cookies for security
3. Protected routes with server-side validation
4. Automatic token refresh with exponential backoff

### Authentication Process

1. **User Authentication**:

   - User clicks the sign-in button
   - Firebase Auth handles the OAuth flow with Google
   - On successful authentication, Firebase returns a user object and ID token

2. **Session Creation**:

   - The ID token is sent to our API endpoint (`/api/auth/session`)
   - The server verifies the token using Firebase Admin SDK
   - A secure HTTP-only cookie is set with the session information
   - This cookie is used for subsequent requests

3. **Server-Side Validation**:

   - Each protected API route validates the session cookie
   - Next.js middleware checks authentication for protected pages
   - If validation fails, the user is redirected to the login page

4. **Token Refresh**:
   - Firebase tokens expire after 1 hour (configurable)
   - The application automatically refreshes tokens before expiration
   - If refresh fails, exponential backoff is implemented for retry attempts

## Implementation Details

### Client-Side Authentication

```typescript
// components/auth/SignInButton.tsx
import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, AuthError } from 'firebase/auth';
import { auth, isFirebaseAuth } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';

export function SignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if Firebase Auth is available (client-side only)
      if (!isFirebaseAuth(auth)) {
        throw new Error('Authentication is not available');
      }

      // Sign in with Google
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Get ID token
      const idToken = await result.user.getIdToken();

      // Create server-side session
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create session');
      }

      // Redirect or update UI
      window.location.href = '/dashboard';
    } catch (err) {
      const authError = err as AuthError;
      console.error('Authentication error:', authError);

      // Handle specific error cases
      switch (authError.code) {
        case 'auth/popup-closed-by-user':
          setError('Sign-in was cancelled');
          break;
        case 'auth/popup-blocked':
          setError('Pop-up was blocked by the browser');
          break;
        default:
          setError('Failed to sign in. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        variant="primary"
      >
        {isLoading ? 'Signing in...' : 'Sign in with Google'}
      </Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
```

### Server-Side Session Management

```typescript
// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth as adminAuth } from '@/lib/firebase-admin';

// Session duration: 14 days in seconds
const SESSION_EXPIRY = 60 * 60 * 24 * 14;

export async function POST(request: NextRequest) {
  try {
    // Get ID token from request body
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID token is required',
        },
        { status: 400 }
      );
    }

    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Create a session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY * 1000, // milliseconds
    });

    // Set the cookie in the response
    cookies().set({
      name: 'session',
      value: sessionCookie,
      maxAge: SESSION_EXPIRY,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
      },
    });
  } catch (error) {
    console.error('Session creation error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create session',
        error: error.message,
      },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  // Clear the session cookie
  cookies().delete('session');

  return NextResponse.json({
    success: true,
    message: 'Session deleted successfully',
  });
}
```

### Token Refresh Mechanism

```typescript
// lib/token-refresh.ts
import { auth, isFirebaseAuth } from './firebase';

// Initial retry delay (in milliseconds)
const INITIAL_RETRY_DELAY = 1000;

// Maximum retry delay (in milliseconds)
const MAX_RETRY_DELAY = 60000; // 1 minute

// Maximum number of retries
const MAX_RETRIES = 5;

/**
 * Refreshes the Firebase ID token with exponential backoff for retries
 * @returns {Promise<string>} The new ID token
 */
export async function refreshIdToken(retryCount = 0, delay = INITIAL_RETRY_DELAY): Promise<string> {
  try {
    // Check if Firebase Auth is available (client-side only)
    if (!isFirebaseAuth(auth) || !auth.currentUser) {
      throw new Error('User not authenticated');
    }

    // Force token refresh
    const newToken = await auth.currentUser.getIdToken(true);

    return newToken;
  } catch (error) {
    // If maximum retries reached, throw the error
    if (retryCount >= MAX_RETRIES) {
      console.error(`Token refresh failed after ${MAX_RETRIES} retries:`, error);
      throw error;
    }

    // Calculate next delay with exponential backoff
    const nextDelay = Math.min(delay * 2, MAX_RETRY_DELAY);
    console.warn(`Token refresh attempt ${retryCount + 1} failed. Retrying in ${nextDelay}ms...`);

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry with increased delay
    return refreshIdToken(retryCount + 1, nextDelay);
  }
}

/**
 * Sets up automatic token refresh before expiration
 */
export function setupTokenRefresh() {
  // Only run on client-side and if authenticated
  if (typeof window === 'undefined' || !isFirebaseAuth(auth) || !auth.currentUser) {
    return;
  }

  // Listen for auth state changes
  auth.onAuthStateChanged(async user => {
    if (!user) return;

    try {
      // Get current token
      const token = await user.getIdTokenResult();

      // Calculate when to refresh (5 minutes before expiration)
      const expirationTime = new Date(token.expirationTime).getTime();
      const refreshTime = expirationTime - 5 * 60 * 1000; // 5 minutes before expiry
      const timeUntilRefresh = refreshTime - Date.now();

      // Schedule token refresh
      if (timeUntilRefresh > 0) {
        setTimeout(async () => {
          try {
            await refreshIdToken();
            console.log('Token refreshed successfully');

            // Setup next refresh
            setupTokenRefresh();
          } catch (error) {
            console.error('Failed to refresh token:', error);
          }
        }, timeUntilRefresh);
      } else {
        // Token is already near expiration, refresh immediately
        await refreshIdToken();
        console.log('Token refreshed immediately');

        // Setup next refresh
        setupTokenRefresh();
      }
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  });
}
```

### Authentication Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from './lib/firebase-admin';

// Paths that require authentication
const PROTECTED_PATHS = ['/dashboard', '/profile', '/settings', '/api/user'];

// Paths that should redirect authenticated users (e.g., login page)
const AUTH_PATHS = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  // Check if the path requires authentication
  const requiresAuth = PROTECTED_PATHS.some(path => request.nextUrl.pathname.startsWith(path));

  // Check if the path is specifically for non-authenticated users
  const isAuthPath = AUTH_PATHS.some(path => request.nextUrl.pathname.startsWith(path));

  try {
    if (session) {
      // Verify the session
      const decodedToken = await auth.verifySessionCookie(session, true);

      // User is authenticated
      if (isAuthPath) {
        // Redirect authenticated users away from auth pages
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      // No session found
      if (requiresAuth) {
        // Redirect unauthenticated users to login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  } catch (error) {
    // Session is invalid or expired
    if (requiresAuth) {
      // Clear the invalid cookie
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  // Continue with the request for all other cases
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths that need authentication checking
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
};
```

## Security Best Practices

Our implementation follows these security best practices:

1. **HTTP-Only Cookies**: Session tokens are stored in HTTP-only cookies to prevent XSS attacks
2. **Short-Lived Tokens**: ID tokens expire after 1 hour, limiting the damage from token theft
3. **Secure Cookie Settings**: Session cookies use the secure flag in production
4. **Server-Side Validation**: All protected routes validate authentication server-side
5. **Custom Claims**: Role-based access control uses Firebase custom claims
6. **Automatic Token Refresh**: Tokens are refreshed automatically before expiration
7. **Exponential Backoff**: Retry mechanism uses exponential backoff to prevent system overload

## Authentication Error Handling

The application handles these common authentication errors:

1. **Invalid Credentials**: Displays user-friendly error messages
2. **Expired Tokens**: Automatically refreshes or redirects to login
3. **Network Errors**: Implements retry with exponential backoff
4. **Revoked Access**: Detects token revocation and redirects to login
5. **Rate Limiting**: Handles Firebase rate limiting gracefully

## Extending Authentication

To add additional authentication providers:

1. **Update Firebase Console**: Enable the desired provider (e.g., Facebook, Twitter)
2. **Modify SignInButton**: Add the new provider as an option
3. **Update UI**: Create provider-specific buttons and flows
4. **Test Thoroughly**: Verify the complete authentication flow

## Testing Authentication

Test the authentication flow using:

1. **Unit Tests**: Test individual authentication functions
2. **Integration Tests**: Verify token validation and session creation
3. **End-to-End Tests**: Test the complete user sign-in journey
4. **Emulator Testing**: Use Firebase Auth Emulator for local testing

## Troubleshooting

Common authentication issues and solutions:

1. **"Firebase App Already Exists"**: Ensure Firebase is initialized only once
2. **CORS Errors**: Add your domain to Firebase Authentication authorized domains
3. **Token Expiration**: Check that token refresh is working correctly
4. **Missing Permissions**: Verify Firebase project configuration
5. **Session Cookie Issues**: Check cookie settings (domain, path, expiry)
