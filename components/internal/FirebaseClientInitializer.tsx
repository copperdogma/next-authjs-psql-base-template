'use client';

import { useEffect } from 'react';
// Import the config file to trigger its client-side execution block
import '@/lib/firebase-config';

/**
 * This component exists solely to ensure the firebase-config.ts client-side
 * initialization logic runs. It imports the config file, triggering any
 * top-level code within the "if (typeof window !== 'undefined')" block.
 */
export default function FirebaseClientInitializer() {
  useEffect(() => {
    // We can potentially add more checks here in the future if needed,
    // e.g., check window.__firebaseAuthInstance__ after a delay.
    console.log(
      '[FirebaseClientInitializer] Component mounted, ensuring firebase-config was imported.'
    );
  }, []);

  // This component renders nothing
  return null;
}
