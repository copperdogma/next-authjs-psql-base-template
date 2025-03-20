'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, Auth } from 'firebase/auth';
import { auth } from '../../lib/firebase';

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
  const [isClientSide, setIsClientSide] = useState(false);
  // Add state to track if we've fully mounted on the client
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Mark that we're now on the client and fully mounted
    setIsClientSide(true);
    setHasMounted(true);
    
    // Skip if not on client side
    if (typeof window === 'undefined') return;
    
    try {
      // Only try to subscribe to auth state if we're on the client
      // Since we're initializing auth conditionally in firebase.ts,
      // we need to be careful about calling methods on it
      if (auth && 'onAuthStateChanged' in auth) {
        const unsubscribe = onAuthStateChanged(auth as Auth, (user) => {
          setUser(user);
          setLoading(false);
        });
    
        // Clean up subscription
        return () => unsubscribe();
      } else {
        // Auth not available or properly initialized
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth provider setup error:', error);
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    loading,
    isClientSide,
  };

  // Don't render anything until we've mounted on the client
  if (!hasMounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 