'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from '@firebase/auth';
import type { User } from '@firebase/auth';
import { auth, isFirebaseAuth } from '../../lib/firebase';
import { shouldRefreshToken, refreshUserTokenAndSession } from '../../lib/auth/token';
import { handleFirebaseError } from '../../lib/utils/firebase-errors';
import { useRouter } from 'next/navigation';

// Create the auth context
type AuthContextType = {
  user: User | null;
  loading: boolean;
  isClientSide: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isClientSide: false,
  signIn: async () => {},
  signOut: async () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Only track if we've mounted to prevent flicker during hydration
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();

  // Sign in function
  const signIn = async () => {
    try {
      if (!isFirebaseAuth(auth)) {
        throw new Error('Firebase Auth not available');
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Create session
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
        credentials: 'include',
      });

      // Add a delay before redirecting to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 300));

      // Redirect to dashboard after successful login
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      handleFirebaseError('Sign In', error);
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      if (!isFirebaseAuth(auth)) {
        throw new Error('Firebase Auth not available');
      }

      await firebaseSignOut(auth);

      // Delete session
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
      });

      // Redirect to home after sign out
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      handleFirebaseError('Sign Out', error);
      throw error;
    }
  };

  // Set up auth state listener and token refresh
  useEffect(() => {
    // Mark that we're now mounted on the client
    setHasMounted(true);

    try {
      // Since we've marked this file with 'use client', we know we're running on the client
      // We still need to check if Firebase Auth is properly initialized
      if (isFirebaseAuth(auth)) {
        const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
          // Update user state
          setUser(firebaseUser);
          setLoading(false);

          // Check if we need to refresh the token
          if (firebaseUser && shouldRefreshToken(firebaseUser)) {
            try {
              await refreshUserTokenAndSession(firebaseUser);
            } catch (error) {
              console.error('Failed to refresh token:', error);
            }
          }

          // Set up a periodic token refresh check
          if (firebaseUser) {
            const refreshInterval = setInterval(
              async () => {
                if (firebaseUser && shouldRefreshToken(firebaseUser)) {
                  try {
                    await refreshUserTokenAndSession(firebaseUser);
                  } catch (error) {
                    console.error('Periodic token refresh failed:', error);
                  }
                }
              },
              5 * 60 * 1000
            ); // Check every 5 minutes

            return () => clearInterval(refreshInterval);
          }

          // Return a no-op cleanup function when there's no user
          return () => {};
        });

        // Clean up subscription
        return unsubscribe;
      } else {
        // Auth not available or properly initialized
        console.warn('Firebase Auth not properly initialized');
        setLoading(false);
        return undefined;
      }
    } catch (error) {
      console.error('Auth provider setup error:', error);
      setLoading(false);
      return undefined;
    }
  }, []);

  // Create the memoized context value
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      isClientSide: hasMounted,
      signIn,
      signOut,
    }),
    [user, loading, hasMounted, signIn, signOut]
  );

  // Don't render anything until we've mounted on the client to prevent hydration mismatch
  if (!hasMounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={contextValue} data-testid="auth-provider">
      {children}
    </AuthContext.Provider>
  );
}
