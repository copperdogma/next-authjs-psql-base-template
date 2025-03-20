'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../app/providers/AuthProvider';

const UserProfile = () => {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Show nothing during server rendering or if not authenticated
  if (!mounted || loading) {
    return <div data-testid="profile-loading">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <Link 
      href="/profile" 
      className="flex items-center gap-2 user-profile" 
      data-testid="user-profile"
      aria-label="User profile"
      role="button"
    >
      {user.photoURL ? (
        <Image
          src={user.photoURL}
          alt="Profile picture"
          width={32}
          height={32}
          className="rounded-full"
          data-testid="profile-image"
        />
      ) : null}
      <div className="flex flex-col">
        <span className="sr-only" data-testid="profile-name">{user.displayName || 'Anonymous'}</span>
      </div>
    </Link>
  );
};

export default UserProfile; 