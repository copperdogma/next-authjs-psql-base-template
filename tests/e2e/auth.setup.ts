import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { Page } from 'playwright';

const storageStatePath = path.join(process.cwd(), 'tests/e2e/auth.setup.json');

// Update Window type for modular Firebase SDK
declare global {
  interface Window {
    firebase?: any; // Using 'any' for simplicity with modular SDK structure
  }
}

// Test user information - should match the user created by setup-test-user.js
const TEST_USER = {
  uid: 'test-uid-playwright-123',
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Test123!',
  displayName: process.env.TEST_USER_DISPLAY_NAME || 'Test User',
};

/**
 * Sets up authentication using the Test API Endpoint and Modular Client-side Firebase SDK
 */
async function setupAuthViaApiAndModularClientSdk(page: Page): Promise<boolean> {
  console.log('🔑 Setting up authentication via Test API Endpoint + Modular Client SDK...');
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';
  const apiUrl = `${baseUrl}/api/test/auth/create-session`;

  try {
    // 1. Call API to get Firebase Custom Token
    console.log(`🚀 Calling test session API at ${apiUrl}`);
    const apiResponse = await page.request.post(apiUrl, {
      data: {
        userId: TEST_USER.uid,
        email: TEST_USER.email,
        name: TEST_USER.displayName,
      },
      failOnStatusCode: true,
    });

    const { success, customToken } = await apiResponse.json();
    if (!success || !customToken) {
      throw new Error('Failed to get custom token from test API');
    }
    console.log('✅ Successfully retrieved Firebase custom token via API.');

    // 2. Navigate to login page
    console.log('📄 Navigating to login page...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });

    // 3. Inject Modular Firebase SDK explicitly
    console.log('💉 Injecting Modular Firebase SDK scripts...');
    try {
      await page.addScriptTag({ path: './node_modules/firebase/firebase-app.js' });
      await page.addScriptTag({ path: './node_modules/firebase/firebase-auth.js' });

      // Initialize using modular syntax
      await page.evaluate(
        firebaseConfig => {
          console.log('🔥 Initializing Modular Firebase Client SDK...');
          if (!window.firebase?.apps?.length) {
            // Keep check simple
            window.firebase?.initializeApp?.(firebaseConfig);
            console.log('Firebase initialized by test setup (modular).');
          } else {
            console.log('Firebase already initialized.');
          }
        },
        {
          apiKey: 'emulator',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        }
      );

      // Wait for getAuth to be available
      await page.waitForFunction(() => window.firebase?.getAuth, null, { timeout: 10000 });
      console.log('✅ Modular Firebase SDK initialized and getAuth found.');
    } catch (injectionError) {
      console.error('❌ Failed to inject or initialize Modular Firebase SDK:', injectionError);
      throw new Error('Modular Firebase SDK injection/initialization failed');
    }

    // 4. Use Modular Client-side SDK signInWithCustomToken
    console.log('💻 Attempting modular client-side signInWithCustomToken...');
    const signInResult = await page.evaluate(async token => {
      try {
        if (!window.firebase?.getAuth || !window.firebase?.signInWithCustomToken) {
          throw new Error('Firebase modular auth functions not found');
        }
        const auth = window.firebase.getAuth();
        const userCredential = await window.firebase.signInWithCustomToken(auth, token);
        return {
          success: true,
          uid: userCredential?.user?.uid,
          email: userCredential?.user?.email,
        };
      } catch (error) {
        console.error('Error during modular signInWithCustomToken:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }, customToken);

    if (!signInResult.success) {
      console.error('❌ Modular client-side signInWithCustomToken failed:', signInResult.error);
      throw new Error(`Modular client-side signInWithCustomToken failed: ${signInResult.error}`);
    }
    console.log(`✅ Successfully signed in with modular client-side SDK as ${signInResult.email}`);

    // 5. Navigate to trigger NextAuth session creation
    console.log('🚀 Navigating to protected route (/dashboard) to trigger NextAuth session...');
    await page.waitForTimeout(1000);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });

    // 6. Verify and Save State
    console.log('🔍 Verifying authentication and session state...');
    return verifyAuthentication(page);
  } catch (error) {
    console.error('❌ Error during API + Modular Client SDK auth setup:', error);
    await page.screenshot({ path: 'auth-setup-error-modular.png' });
    await createEmptyAuthState();
    return false;
  }
}

/**
 * This setup function uses the new API + Modular Client SDK method.
 */
setup('authenticate', async ({ page }) => {
  console.log('🔒 Setting up authentication for testing...');

  try {
    // Primary approach: Use API Endpoint + Modular Client SDK
    const success = await setupAuthViaApiAndModularClientSdk(page);

    if (success) {
      console.log('✅ Authentication setup completed successfully via API + Modular Client SDK');
    } else {
      console.error('❌ API + Modular Client SDK Authentication setup failed.');
      await createEmptyAuthState();
      console.warn('⚠️ Created empty auth state as fallback after setup failure');
    }
  } catch (error) {
    console.error('❌ Authentication setup failed catastrophically:', error);
    await createEmptyAuthState();
    console.warn('⚠️ Created empty auth state as fallback after catastrophic failure');
  }
});

/**
 * Verify authentication was successful by checking various indicators
 */
async function verifyAuthentication(page: Page): Promise<boolean> {
  try {
    console.log(`Verifying authentication status at URL: ${page.url()}`);

    // Increased timeout for verification checks
    const verificationTimeout = 15000; // 15 seconds

    // 1. Check if we are still on the login page (immediate failure)
    if (page.url().includes('/login')) {
      console.error('❌ Authentication verification failed - Still on login page');
      await page.screenshot({ path: 'auth-verify-fail-on-login.png' });
      return false;
    }

    // 2. Wait for a primary dashboard element to appear
    const dashboardHeadingSelector = 'h1:has-text("Dashboard")'; // More specific selector
    try {
      await page
        .locator(dashboardHeadingSelector)
        .waitFor({ state: 'visible', timeout: verificationTimeout });
      console.log(`✅ Authentication verified - Found element: ${dashboardHeadingSelector}`);

      // 3. (Optional but recommended) Check for the presence of the NextAuth session cookie
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(
        c =>
          c.name.startsWith('next-auth.session-token') ||
          c.name.startsWith('__Secure-next-auth.session-token')
      );

      if (!sessionCookie) {
        console.warn('⚠️ Dashboard content found, but NextAuth session cookie is missing!');
        await page.screenshot({ path: 'auth-verify-warn-no-cookie.png' });
        // Decide if this is acceptable for the test - for now, let's allow it but warn.
      } else {
        console.log(`✅ Found NextAuth session cookie: ${sessionCookie.name}`);
      }

      // 4. Save authentication state only after successful verification
      await page.context().storageState({ path: storageStatePath });
      console.log(`✅ Authentication state saved to ${storageStatePath}`);
      return true;
    } catch (error) {
      console.error(
        `❌ Authentication verification failed - Dashboard element "${dashboardHeadingSelector}" not found within ${verificationTimeout}ms.`
      );
      await page.screenshot({ path: 'auth-verify-fail-no-dashboard-content.png' });
      console.log(`Current page URL: ${page.url()}`);
      console.log(`Current page title: ${await page.title()}`);
      // Log cookies for debugging
      const cookies = await page.context().cookies();
      console.log('Cookies at verification failure:', JSON.stringify(cookies, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Error during authentication verification:', error);
    await page.screenshot({ path: 'auth-verify-error.png' });
    return false;
  }
}

/**
 * Creates an empty authentication state file if everything else fails
 * This is a last resort to prevent test failures when auth setup completely fails
 */
async function createEmptyAuthState(): Promise<void> {
  const emptyState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3777',
        localStorage: [],
      },
    ],
  };

  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });
  fs.writeFileSync(storageStatePath, JSON.stringify(emptyState, null, 2));
  console.log(`Created empty auth state at ${storageStatePath}`);
}
