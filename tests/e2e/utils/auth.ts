// --- JWT Generation Logic ---
// Note: This requires environment variables for secrets and potentially issuer/audience.
//       Make sure NEXTAUTH_SECRET is set in .env.test or your environment.

const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  throw new Error('NEXTAUTH_SECRET is not defined. Cannot generate JWT for testing.');
}

// Function removed as it's no longer used
/*
export async function generateTestSessionToken(
  userId: string = TEST_USER_ID_DEFAULT
): Promise<string> {
  // ... implementation ...
}
*/
