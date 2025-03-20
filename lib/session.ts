import { cookies } from 'next/headers';
import { adminAuth } from './firebase-admin';

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return null;
    }

    // Verify the session cookie and get the user claims
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    
    // Get additional user data if needed
    const user = await adminAuth.getUser(decodedClaims.uid);

    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (err) {
    console.error('Failed to get session:', err);
    return null;
  }
} 