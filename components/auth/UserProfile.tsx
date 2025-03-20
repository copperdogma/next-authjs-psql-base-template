'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../app/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const UserProfile = () => {
  const { user, isClientSide } = useAuth();

  if (!isClientSide) {
    return <div data-testid="profile-loading">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <Link href="/profile" className="flex items-center gap-2">
      {user.photoURL ? (
        <Image
          src={user.photoURL}
          alt="Profile picture"
          width={32}
          height={32}
          className="rounded-full"
          priority={false}
          loading="lazy"
        />
      ) : null}
      <div className="flex flex-col">
        <span className="sr-only" data-testid="profile-name">{user.displayName || 'Anonymous'}</span>
      </div>
    </Link>
  );
};

export default UserProfile; 