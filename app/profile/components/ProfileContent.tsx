'use client';

import { useAuth } from '@/app/providers/AuthProvider';
import { signOut } from '@firebase/auth';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import type { Auth } from '@firebase/auth';

export default function ProfileContent() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      if ('signOut' in auth) {
        await signOut(auth as Auth);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col items-center space-y-6 md:flex-row md:items-start md:space-x-8 md:space-y-0">
          {/* Profile Image */}
          <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-gray-200">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || 'User profile'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 160px, 160px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-500 text-4xl font-bold text-white">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Display Name</p>
              <p className="text-lg font-semibold">{user.displayName || 'Not provided'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Email Verified</p>
              <p className="text-lg font-semibold">{user.emailVerified ? 'Yes' : 'No'}</p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSignOut}
                className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
