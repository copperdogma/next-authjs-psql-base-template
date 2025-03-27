import { test as base, Page, expect } from '@playwright/test';
import { FirebaseAuthUtils, TEST_USER } from './auth-fixtures';
import { TestSelectors, PerformanceMetrics, ViewportInfo } from '../../utils/test-types';

/**
 * Common UI selectors for E2E tests
 * More maintainable than having them scattered across different test files
 */
export const UI_SELECTORS: TestSelectors = {
  // Layout elements
  LAYOUT: {
    NAVBAR: '[data-testid="navbar"], header, [role="banner"], nav, [role="navigation"]',
    MAIN_CONTENT: '[data-testid="main-content"], main, [role="main"]',
    FOOTER: '[data-testid="footer"], footer, [role="contentinfo"]',
    CONTAINER: '[data-testid="container"], .container, main > div',
  },

  // Authentication elements
  AUTH: {
    SIGN_IN_BUTTON:
      '[data-testid="auth-button"], button:has-text("Sign In"), button:has-text("Log In")',
    SIGN_OUT_BUTTON:
      '[data-testid="auth-button"], button:has-text("Sign Out"), button:has-text("Log Out")',
    USER_PROFILE:
      '[data-testid="user-profile"], [aria-label*="profile" i], [aria-label*="account" i]',
    USER_AVATAR: '[data-testid="user-avatar"], img[alt*="profile" i], [aria-label*="avatar" i]',
  },

  // Form elements
  FORM: {
    EMAIL_FIELD: '[data-testid="email-field"], input[type="email"], input[name="email"]',
    PASSWORD_FIELD:
      '[data-testid="password-field"], input[type="password"], input[name="password"]',
    SUBMIT_BUTTON:
      '[data-testid="submit-button"], button[type="submit"], form button:has-text("Submit")',
  },

  // Navigation elements
  NAV: {
    HOME_LINK: '[data-testid="nav-home"], a[href="/"], a:has-text("Home")',
    DASHBOARD_LINK: '[data-testid="nav-dashboard"], a[href="/dashboard"], a:has-text("Dashboard")',
    PROFILE_LINK: '[data-testid="nav-profile"], a[href="/profile"], a:has-text("Profile")',
    SETTINGS_LINK: '[data-testid="nav-settings"], a[href="/settings"], a:has-text("Settings")',
  },
};

/**
 * Utility functions for E2E tests
 */
export class TestUtils {
  /**
   * Wait for navigation to complete and page to be stable
   * @param page Playwright page
   * @param url Optional URL to wait for (if known)
   */
  static async waitForNavigation(page: Page, url?: string): Promise<void> {
    // First wait for network to be idle
    await page.waitForLoadState('networkidle');

    // If a specific URL was provided, check that we're on it
    if (url) {
      await expect(page).toHaveURL(url);
    }

    // Then wait for DOM content to be loaded
    await page.waitForLoadState('domcontentloaded');
  }

  /**
   * Check if an element exists without waiting/failing
   * @param page Playwright page
   * @param selector Element selector
   * @returns Whether the element exists
   */
  static async elementExists(page: Page, selector: string): Promise<boolean> {
    const elements = await page.$$(selector);
    return elements.length > 0;
  }

  /**
   * Wait for an element with a set of alternative selectors
   * Useful when the exact selector structure might vary
   * @param page Playwright page
   * @param selectors Array of possible selectors to try
   * @param timeout Optional timeout in milliseconds (default: 5000)
   * @returns The element if found
   */
  static async waitForAnySelector(page: Page, selectors: string[], timeout = 5000): Promise<any> {
    const timeoutTime = Date.now() + timeout;

    while (Date.now() < timeoutTime) {
      for (const selector of selectors) {
        const element = await page.$(selector);
        if (element) {
          return element;
        }
      }
      // Short delay before trying again
      await page.waitForTimeout(100);
    }

    throw new Error(`None of the selectors found within timeout: ${selectors.join(', ')}`);
  }

  /**
   * Get viewport information to help debug responsive issues
   * @param page Playwright page
   * @returns Object with viewport information
   */
  static async getViewportInfo(page: Page): Promise<ViewportInfo> {
    const viewportSize = page.viewportSize();
    if (!viewportSize) {
      throw new Error('Viewport size not available');
    }

    return {
      width: viewportSize.width,
      height: viewportSize.height,
      isMobile: viewportSize.width < 768, // Common breakpoint for mobile
    };
  }

  /**
   * Take an accessibility snapshot of the current page
   * @param page Playwright page
   * @returns The accessibility snapshot
   */
  static async takeAccessibilitySnapshot(page: Page): Promise<Record<string, unknown>> {
    return await page.evaluate(() => {
      // @ts-expect-error - window.getComputedAccessibilityTree is available in Playwright
      return (
        window.getComputedAccessibilityTree?.() || {
          error: 'Accessibility tree not available in this browser',
        }
      );
    });
  }

  /**
   * Test basic page loading performance
   * @param page Playwright page
   * @param url URL to navigate to
   * @returns Basic performance metrics
   */
  static async getPerformanceMetrics(page: Page, url: string): Promise<PerformanceMetrics> {
    // Navigate to the page
    await page.goto(url, { waitUntil: 'load' });

    // Get performance metrics
    return await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('navigation');
      if (perfEntries && perfEntries.length > 0) {
        const navigationEntry = perfEntries[0] as PerformanceNavigationTiming;
        return {
          loadTime: navigationEntry.loadEventEnd - navigationEntry.startTime,
          domContentLoadedTime:
            navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime,
          firstPaintTime: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        };
      }
      return {
        loadTime: 0,
        domContentLoadedTime: 0,
        firstPaintTime: 0,
        error: 'Performance metrics not available',
      };
    });
  }
}

// Define common user roles for testing
export const USER_ROLES = {
  ANONYMOUS: 'anonymous',
  AUTHENTICATED: 'authenticated',
  ADMIN: 'admin',
};

// Define the types for our custom fixtures
type TestFixtures = {
  // Auth fixtures
  authUtils: typeof FirebaseAuthUtils;
  authenticatedPage: Page;
  adminPage: Page;

  // UI fixtures
  selectors: TestSelectors;
  testUtils: typeof TestUtils;

  // Device fixtures
  mobilePage: Page;
  tabletPage: Page;
  desktopPage: Page;
};

// Enhanced test fixture that extends base test with our custom fixtures
export const test = base.extend<TestFixtures>({
  // Auth fixtures
  authUtils: async ({}, use) => {
    await use(FirebaseAuthUtils);
  },

  authenticatedPage: async ({ page }, use) => {
    // Set up an authenticated page with standard test user
    await FirebaseAuthUtils.mockSignedInUser(page, TEST_USER);
    await page.goto('/');
    await use(page);
    await FirebaseAuthUtils.clearAuthState(page);
  },

  adminPage: async ({ page }, use) => {
    // Set up an admin user page
    const adminUser = {
      ...TEST_USER,
      // Add admin-specific properties
      customClaims: { admin: true },
    };
    await FirebaseAuthUtils.mockSignedInUser(page, adminUser);
    await page.goto('/');
    await use(page);
    await FirebaseAuthUtils.clearAuthState(page);
  },

  // UI fixtures
  selectors: async ({}, use) => {
    await use(UI_SELECTORS);
  },

  testUtils: async ({}, use) => {
    await use(TestUtils);
  },

  // Device fixtures
  mobilePage: async ({ browser }, use) => {
    // Set up mobile viewport
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }, // iPhone SE dimensions
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  tabletPage: async ({ browser }, use) => {
    // Set up tablet viewport
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 }, // iPad dimensions
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  desktopPage: async ({ browser }, use) => {
    // Set up desktop viewport
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }, // HD desktop
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
