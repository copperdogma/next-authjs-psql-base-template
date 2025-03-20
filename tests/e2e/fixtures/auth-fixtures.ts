import { test as base, Page } from '@playwright/test';
import { TEST_CONFIG } from '../../utils/routes';

// Test user data for authentication tests - use the centralized test configuration
export const TEST_USER = TEST_CONFIG.TEST_USER;

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
    await page.evaluate((userData) => {
      // Store in localStorage to simulate Firebase auth state
      // This matches the pattern used by Firebase Web SDK
      localStorage.setItem('firebase:authUser:test-project-id', JSON.stringify(userData));
      
      // Some applications might use custom events
      try {
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
          detail: { user: userData }
        }));
      } catch (e) {
        console.log('Custom auth event dispatch failed, but localStorage mock should still work');
      }
    }, user);
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
   * @returns Promise<boolean>
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    return await page.evaluate((config) => {
      // Check for Firebase auth data in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase:auth') || key.includes('authUser'))) {
          return true;
        }
      }
      return false;
    }, TEST_CONFIG.FIREBASE);
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