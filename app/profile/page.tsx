import { Suspense } from 'react';
import ProfileContent from './components/ProfileContent';

// This is a server component
export default function Profile() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading profile data...</div>}>
      <ProfileContent />
    </Suspense>
  );
} 