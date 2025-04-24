'use client';

import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface SessionProviderWrapperProps {
  children: ReactNode;
  session: Session | null; // Session can be null if not authenticated
}

const SessionProviderWrapper = ({ children, session }: SessionProviderWrapperProps) => {
  const log = logger.child({ component: 'SessionProviderWrapper' });

  log.debug('Rendering SessionProvider', { hasSession: !!session });
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default SessionProviderWrapper;
