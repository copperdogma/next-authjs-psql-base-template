'use client';

import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import NoSessionState from './NoSessionState';
import DashboardSections from './DashboardSections';

export default function DashboardContent(): React.ReactNode {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  // Add useEffect to log session status for debugging
  useEffect(() => {
    // Only log in development/test environments
    if (process.env.NODE_ENV !== 'production') {
      if (status === 'loading') {
        console.log('DashboardContent: Session loading...');
      } else if (status === 'authenticated') {
        console.log('DashboardContent: Session authenticated', session);
      } else if (status === 'unauthenticated') {
        console.log('DashboardContent: Session unauthenticated');
      }
    }

    if (status === 'unauthenticated') {
      setError('Session not authenticated. Please log in again.');
    }
  }, [status, session]);

  // Loading state
  if (status === 'loading') {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} />;
  }

  // No session state
  if (!session?.user) {
    return <NoSessionState />;
  }

  return <DashboardSections session={session} />;
}
