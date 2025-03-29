import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | Next.js Template',
  description: 'Manage your user profile',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Suspense fallback={<div className="p-6 text-center">Loading profile content...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
