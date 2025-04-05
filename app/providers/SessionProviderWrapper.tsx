'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { loggers } from '@/lib/logger'; // Assuming logger setup
import SessionErrorHandler from './SessionErrorHandler';
import SessionErrorDisplay from './SessionErrorDisplay';

const logger = loggers.auth;

// Internal component to handle session logic
function SessionLogic() {
  const { data: session, status } = useSession();

  useEffect(() => {
    logger.debug('Session status changed', { status, session });

    if (status === 'authenticated' && session?.user) {
      logger.info('User authenticated', { userId: session.user.id, email: session.user.email });
      // Additional logic for authenticated users (e.g., analytics)
    } else if (status === 'unauthenticated') {
      logger.info('User unauthenticated');
      // Additional logic for unauthenticated users
    }
    // Explicitly return undefined to satisfy TS7030
    return undefined;
  }, [session, status]);

  // Return null as this component doesn't render anything itself
  return null;
}

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  const [sessionError, setSessionError] = useState<Error | null>(null);

  return (
    <SessionProvider>
      <SessionLogic />
      <SessionErrorHandler sessionError={sessionError} setSessionError={setSessionError} />
      {sessionError ? <SessionErrorDisplay error={sessionError} /> : children}
    </SessionProvider>
  );
}
