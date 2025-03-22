import { User } from '@firebase/auth';

// Session expiration constants
export const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

/**
 * Checks if a token should be refreshed
 * @param user The Firebase user object
 * @returns True if the token should be refreshed
 */
export function shouldRefreshToken(user: User): boolean {
  try {
    // Firebase doesn't expose token expiration directly in the public API
    // We'll use the last refresh time if available
    const lastRefreshTime = user.metadata.lastSignInTime 
      ? new Date(user.metadata.lastSignInTime).getTime() 
      : user.metadata.creationTime 
        ? new Date(user.metadata.creationTime).getTime() 
        : 0;
    
    // If we have no timestamp, we should refresh
    if (lastRefreshTime === 0) {
      return true;
    }
    
    // Firebase tokens expire after 1 hour by default
    const estimatedExpirationTime = lastRefreshTime + (60 * 60 * 1000);
    const expiresIn = estimatedExpirationTime - Date.now();
    
    // Return true if token expiration is within our refresh threshold
    return expiresIn < TOKEN_REFRESH_THRESHOLD_MS;
  } catch (error) {
    console.error('Error checking token refresh:', error);
    // If we get an error, better to refresh the token to be safe
    return true;
  }
}

/**
 * Refreshes the Firebase ID token and updates the session
 * @param user The Firebase user object
 */
export async function refreshUserTokenAndSession(user: User): Promise<void> {
  try {
    // Get a fresh token
    const idToken = await user.getIdToken(true);
    
    // Update the session with the new token
    await updateSession(idToken);
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

/**
 * Updates the session with a new token
 * @param idToken The new Firebase ID token
 */
async function updateSession(idToken: string): Promise<void> {
  try {
    const response = await fetch('/api/auth/session/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
      credentials: 'include', // Ensure cookies are sent with the request
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to refresh session: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
} 