'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import React, { ReactNode, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useUserStore } from '@/lib/store/userStore'; // Import the Zustand store

interface SessionProviderWrapperProps {
  children: ReactNode;
  session: Session | null; // Prop session is for initial state on server render
}

// Component to synchronize NextAuth session with Zustand store
const UserStoreSync = () => {
  const { data: session, status } = useSession();
  const setUserDetails = useUserStore(state => state.setUserDetails);
  const clearUserDetails = useUserStore(state => state.clearUserDetails);
  const log = logger.child({ component: 'UserStoreSync' });

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      log.info('Syncing authenticated session to Zustand store', {
        userId: session.user.id,
      });
      setUserDetails({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      });
    } else if (status === 'unauthenticated') {
      log.info('Clearing Zustand store due to unauthenticated session');
      clearUserDetails();
    }
    // We only want this effect to run when session or status changes
  }, [session, status, setUserDetails, clearUserDetails, log]);

  return null; // This component does not render anything
};

const SessionProviderWrapper = ({ children, session }: SessionProviderWrapperProps) => {
  const log = logger.child({ component: 'SessionProviderWrapper' });

  log.info('Rendering SessionProviderWrapper', {
    hasInitialSession: !!session,
    initialUserId: session?.user?.id,
  });

  // SessionProvider manages the session state internally
  // UserStoreSync hooks into that state via useSession()
  return (
    <SessionProvider session={session}>
      <UserStoreSync />
      {children}
    </SessionProvider>
  );
};

export default SessionProviderWrapper;
