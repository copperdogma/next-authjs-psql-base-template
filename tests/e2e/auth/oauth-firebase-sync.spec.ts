import { test, expect } from '@playwright/test';
import { randomBytes } from 'crypto';
import { initializeAdminApp, deleteFirebaseUserByEmail } from './../utils/firebase-admin-utils'; // Adjusted path again
import { prisma } from '@/lib/prisma'; // Import prisma client
import { waitForElementToBeVisible } from '../../utils/selectors'; // Import specific function

// Initialize Firebase Admin SDK
const adminApp = initializeAdminApp();

test.describe.serial('OAuth Firebase Sync', () => {
  const userEmail = `test-oauth-sync-${randomBytes(4).toString('hex')}@example.com`;
  const userName = 'OAuth Sync Test User';
  let userId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    // Clear potential existing user from previous runs (Firebase & DB)
    if (adminApp) {
      await deleteFirebaseUserByEmail(adminApp, userEmail);
    } else {
      console.warn('Firebase Admin SDK not initialized in beforeAll, skipping Firebase cleanup.');
    }
    await prisma.user.deleteMany({ where: { email: userEmail } });

    // --- Standard Login Setup ---
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Navigate to Login Page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 2. Initiate Google Login
    // Find and click the Google Sign-In button using waitForElementToBeVisible
    // Assuming the key 'credentials.googleSignInButton' exists and is correctly defined
    const googleSignInButton = await waitForElementToBeVisible(
      page,
      'credentials.googleSignInButton'
    );
    console.log('Clicking Google Sign-in button...');
    await googleSignInButton.click();

    // 3. Wait for redirect to Dashboard
    console.log('Waiting for navigation to Dashboard after mock Google sign-in...');
    await page.waitForURL(url => url.pathname === '/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log('Successfully navigated to Dashboard.');

    // 4. Get User ID from Database (created by PrismaAdapter)
    console.log(`Fetching user ID from DB for email: ${userEmail}`);
    const dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
    expect(dbUser, 'User should exist in DB after OAuth login').not.toBeNull();
    if (!dbUser) {
      throw new Error(
        'Test setup failed: dbUser is null after OAuth login despite expect().not.toBeNull()'
      );
    }
    expect(dbUser?.name, 'User name in DB should match expected').toBe(userName);
    userId = dbUser.id; // No non-null assertion needed
    console.log(`User ID from DB: ${userId}`);

    // Close the setup page/context
    await context.close();
  });

  test('should create a corresponding Firebase Auth user after first Google OAuth login', async () => {
    test.skip(!adminApp, 'Firebase Admin SDK not initialized, skipping test.');
    expect(userId, 'User ID should have been retrieved in beforeAll hook').not.toBeNull();

    if (!adminApp) {
      console.error(
        'Firebase Admin SDK not available in test, though test.skip should have caught this.'
      );
      test.fail(true, 'Firebase Admin SDK not available.');
      return;
    }
    if (!userId) {
      console.error('User ID is null in test, though expect() should have caught this.');
      test.fail(true, 'User ID is null.');
      return;
    }

    console.log(`Verifying Firebase Auth user existence for UID: ${userId}`);
    try {
      const firebaseUser = await adminApp.auth().getUser(userId); // No non-null assertions needed
      console.log(`Firebase user found: ${firebaseUser.uid}, Email: ${firebaseUser.email}`);
      expect(firebaseUser).toBeDefined();
      expect(firebaseUser.uid).toBe(userId);
      expect(firebaseUser.email).toBe(userEmail);
      expect(firebaseUser.displayName).toBe(userName);
      expect(firebaseUser.emailVerified).toBe(true); // Based on our JWT callback logic
    } catch (error: any) {
      console.error('Error fetching Firebase user:', error);
      test.fail(true, `Failed to get Firebase user: ${error.message}`);
    }
  });

  test.afterAll(async () => {
    // Clean up the created user from Firebase
    if (adminApp && userEmail) {
      await deleteFirebaseUserByEmail(adminApp, userEmail);
    } else {
      console.warn(
        'Firebase Admin SDK not initialized or email missing in afterAll, skipping Firebase cleanup.'
      );
    }
    // Clean up the test user from DB
    if (userId) {
      console.log(`Cleaning up DB user: ${userId}`);
      await prisma.user.deleteMany({ where: { id: userId } });
      console.log(`Successfully deleted DB user: ${userId}`);
    }
    await prisma.$disconnect();
  });
});
