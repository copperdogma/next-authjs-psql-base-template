import { test as base, Page } from '@playwright/test';
import { TEST_CONFIG } from '../../utils/routes';

// Test user data for authentication tests - use the centralized test configuration
export const TEST_USER = {
  uid: TEST_CONFIG.TEST_USER.UID,
  email: TEST_CONFIG.TEST_USER.EMAIL,
  displayName: TEST_CONFIG.TEST_USER.DISPLAY_NAME,
  photoURL: TEST_CONFIG.TEST_USER.PHOTO_URL,
  emailVerified: true,
  isAnonymous: false,
  // Add other properties expected by Firebase Auth
  phoneNumber: null,
  providerData: [
    {
      providerId: 'password', 
      uid: TEST_CONFIG.TEST_USER.EMAIL, 
      displayName: TEST_CONFIG.TEST_USER.DISPLAY_NAME, 
      email: TEST_CONFIG.TEST_USER.EMAIL,
      phoneNumber: null,
      photoURL: TEST_CONFIG.TEST_USER.PHOTO_URL
    }
  ],
  // Mock required methods
  getIdToken: () => Promise.resolve('mock-id-token'),
  metadata: { creationTime: new Date().toISOString(), lastSignInTime: new Date().toISOString() }
};

/**
 * Firebase Auth test utilities
 * Provides common functions for mocking Firebase authentication in tests
 */
export class FirebaseAuthUtils {
  /**
   * Mock a signed-in user
   * @param page Playwright page
   * @param user User data to mock
   */
  static async mockSignedInUser(page: Page, user = TEST_USER) {
    const projectId = TEST_CONFIG.FIREBASE.PROJECT_ID;
    const authKey = `firebase:authUser:${projectId}`;
    
    // Convert user object to JSON to avoid serialization issues
    const userJson = JSON.stringify(user);
    
    await page.evaluate(
      ([userJsonString, storageKey]) => {
        const userData = JSON.parse(userJsonString);
        console.log('Mocking Firebase auth with user:', userData);
        
        // Store in localStorage to simulate Firebase auth state
        // This matches the pattern used by Firebase Web SDK
        localStorage.setItem(storageKey, userJsonString);
        
        // Force reload auth state by dispatching storage event
        try {
          // This helps with auth state detection in some implementations
          window.dispatchEvent(new StorageEvent('storage', {
            key: storageKey,
            newValue: userJsonString,
            storageArea: localStorage
          }));
          
          // Some applications might use custom events
          window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: userData }
          }));
        } catch (e) {
          console.log('Custom auth event dispatch failed, but localStorage mock should still work');
        }
      }, 
      [userJson, authKey]
    );
    
    // Add a small delay to let the auth state propagate
    await page.waitForTimeout(300);
  }
  
  /**
   * Clear authentication state
   * @param page Playwright page
   */
  static async clearAuthState(page: Page) {
    await page.evaluate(() => {
      // Clear all auth-related items from localStorage
      const authKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase:auth') || key.includes('authUser'))) {
          authKeys.push(key);
        }
      }
      
      // Remove all auth keys
      authKeys.forEach(key => localStorage.removeItem(key));
      
      // Dispatch sign out event if app listens for it
      try {
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
          detail: { user: null }
        }));
      } catch (e) {
        // Ignore errors from event dispatch
      }
    });
  }
  
  /**
   * Check if user is authenticated
   * @param page Playwright page
   * @param config Optional Firebase configuration with more flexibility
   * @returns Promise<boolean>
   */
  static async isAuthenticated(page: Page, config?: any): Promise<boolean> {
    return await page.evaluate((config) => {
      // Use the provided config or fallback to default
      const firebaseConfig = config || {};
      
      // Check for Firebase auth data in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('firebase:auth') || 
          key.includes('authUser') ||
          // Check for project-specific keys if config is provided
          (firebaseConfig.projectId && key.includes(firebaseConfig.projectId))
        )) {
          // If we found an auth item, verify it contains valid data
          const value = localStorage.getItem(key);
          return !!value && value !== 'null' && value !== '{}';
        }
      }
      return false;
    }, config || TEST_CONFIG.FIREBASE);
  }
}

// Define the types for our custom fixtures
type AuthFixtures = {
  authUtils: typeof FirebaseAuthUtils;
  authenticatedPage: Page;
};

// Auth fixture that extends the base test with authentication utilities
export const test = base.extend<AuthFixtures>({
  // Auth utilities directly available in tests
  authUtils: async ({}, use) => {
    await use(FirebaseAuthUtils);
  },
  
  // Page with authentication already set up
  authenticatedPage: async ({ page }, use) => {
    // Sign in the test user
    await FirebaseAuthUtils.mockSignedInUser(page);
    
    // Go to home page
    await page.goto('/');
    
    // Use the authenticated page
    await use(page);
    
    // Clean up - clear auth state
    await FirebaseAuthUtils.clearAuthState(page);
  }
}); 