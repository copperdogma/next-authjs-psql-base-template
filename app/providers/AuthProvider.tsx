'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { onAuthStateChanged } from '@firebase/auth';
import type { User, Auth } from '@firebase/auth';
import { auth, isFirebaseAuth } from '../../lib/firebase';
import { shouldRefreshToken, refreshUserTokenAndSession } from '../../lib/auth/token';

// Create the auth context
type AuthContextType = {
  user: User | null;
  loading: boolean;
  isClientSide: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isClientSide: false,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Only track if we've mounted to prevent flicker during hydration
  const [hasMounted, setHasMounted] = useState(false);

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

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      loading,
      isClientSide: hasMounted,
    }),
    [user, loading, hasMounted]
  );

  // Don't render anything until we've mounted on the client to prevent hydration mismatch
  if (!hasMounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={value} data-testid="auth-provider">
      {children}
    </AuthContext.Provider>
  );
}
