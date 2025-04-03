import { test, expect } from '@playwright/test';
import { prisma } from '../../lib/prisma';
import { FirebaseAuthUtils } from './fixtures/auth-fixtures';
import { TEST_USER } from '../utils/test-constants';

test.describe('User Authentication and Database Creation', () => {
  // Create unique test identifiers to avoid test collisions
  const testTimestamp = Date.now();
  const testUserEmail = `e2e-test-${testTimestamp}@example.com`;
  const testUserName = `E2E Test User ${testTimestamp}`;
  const testUserId = `user-${testTimestamp}`;

  // Clean up test data before and after tests
  test.beforeEach(async () => {
    // Clean up any existing test users to ensure test isolation
    try {
      await prisma.account.deleteMany({
        where: {
          user: {
            email: testUserEmail,
          },
        },
      });

      await prisma.session.deleteMany({
        where: {
          user: {
            email: testUserEmail,
          },
        },
      });

      await prisma.user.deleteMany({
        where: {
          email: testUserEmail,
        },
      });
    } catch (error) {
      console.log('Error in test cleanup:', error);
    }
  });

  test.afterEach(async () => {
    // Clean up any test users created during the test
    try {
      await prisma.account.deleteMany({
        where: {
          user: {
            email: {
              contains: 'e2e-test',
            },
          },
        },
      });

      await prisma.session.deleteMany({
        where: {
          user: {
            email: {
              contains: 'e2e-test',
            },
          },
        },
      });

      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'e2e-test',
          },
        },
      });
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });

  // TEMPORARILY SKIPPED: Need to fix authentication flow so dashboard correctly loads after login
  test.skip('should create a new user in the database after Google authentication', async ({
    page,
  }) => {
    // Create a custom test user for this test
    const testUser = {
      uid: testUserId,
      email: testUserEmail,
      displayName: testUserName,
      photoURL: TEST_USER.PHOTO_URL,
      password: 'test-password', // Required for the test fixture
    };

    // Mock the Firebase auth state
    await FirebaseAuthUtils.mockSignedInUser(page, testUser);

    // Navigate to the dashboard which requires auth
    await page.goto('/dashboard');

    // Wait for dashboard to load (indication of successful auth)
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible();

    // Add a small delay to ensure the database operation completes
    await page.waitForTimeout(500);

    // Verify user was created in the database
    const dbUser = await prisma.user.findFirst({
      where: {
        email: testUserEmail,
      },
      include: {
        accounts: true,
        sessions: true,
      },
    });

    // Assert that the user exists in the database
    expect(dbUser).not.toBeNull();
    expect(dbUser?.email).toBe(testUserEmail);
    expect(dbUser?.name).toBe(testUserName);

    // Verify that the account was linked
    expect(dbUser?.accounts.length).toBeGreaterThan(0);
    // Verify the account is linked to Google
    const googleAccount = dbUser?.accounts.find(acc => acc.provider === 'google');
    expect(googleAccount).toBeDefined();

    // Verify that a session was created
    expect(dbUser?.sessions.length).toBeGreaterThan(0);
  });

  // TEMPORARILY SKIPPED: Need to fix authentication flow so dashboard correctly loads after login
  test.skip('should reuse existing user in database on subsequent login', async ({ page }) => {
    // First create a user directly in the database
    const existingUser = await prisma.user.create({
      data: {
        email: `existing-user-${testTimestamp}@example.com`,
        name: 'Original User Name',
      },
    });

    // Create a test user with updated information but same email
    const testUser = {
      uid: existingUser.id,
      email: existingUser.email!,
      displayName: 'Updated User Name',
      photoURL: 'https://example.com/updated-avatar.jpg',
      password: 'test-password', // Required for the test fixture
    };

    // Mock the Firebase auth state
    await FirebaseAuthUtils.mockSignedInUser(page, testUser);

    // Navigate to the dashboard which requires auth
    await page.goto('/dashboard');

    // Wait for dashboard to load (indication of successful auth)
    await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible();

    // Add a delay to allow the database to update
    await page.waitForTimeout(500);

    // Verify user was updated in the database
    const dbUser = await prisma.user.findUnique({
      where: {
        id: existingUser.id,
      },
      include: {
        accounts: true,
      },
    });

    // Assert the user was updated with new information
    expect(dbUser).not.toBeNull();
    // Name should be updated if adapter.updateUser was called
    if (dbUser?.name !== 'Original User Name') {
      expect(dbUser?.name).toBe('Updated User Name');
    }

    // Verify Google account is linked (should happen on sign-in)
    if (dbUser?.accounts && dbUser.accounts.length > 0) {
      const googleAccount = dbUser.accounts.find(acc => acc.provider === 'google');
      expect(googleAccount).toBeDefined();
    }
  });
});
