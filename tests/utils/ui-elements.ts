/**
 * UI element definitions for test selectors
 * Extracted from selectors.ts to reduce file size
 */
import { AriaRole, ElementSelector } from './selector-types';

/**
 * UI Elements grouped by component/page
 */
export const UI_ELEMENTS = {
  // Layout elements
  LAYOUT: {
    NAVBAR: {
      testId: 'navbar',
      role: 'navigation' as AriaRole,
      tag: 'nav',
      css: 'header nav, nav, header, .navbar, [role="navigation"]',
      description: 'Main navigation bar',
    },
    MAIN_CONTENT: {
      testId: 'main-content',
      role: 'main' as AriaRole,
      tag: 'main',
      css: 'main, [role="main"], .container',
      description: 'Main content area',
    },
    FOOTER: {
      testId: 'footer',
      role: 'contentinfo' as AriaRole,
      tag: 'footer',
      css: 'footer, [role="contentinfo"]',
      description: 'Page footer',
    },
  },

  // Navigation elements
  NAVIGATION: {
    DESKTOP_MENU: {
      testId: 'desktop-menu',
      css: 'nav div[class*="hidden md:flex"]',
      description: 'Desktop navigation menu',
    },
    MOBILE_MENU_BUTTON: {
      testId: 'mobile-menu-button',
      role: { name: 'button', options: { name: 'Main menu' } },
      css: 'button[aria-label="Main menu"], button.md\\:hidden',
      description: 'Mobile menu toggle button',
    },
    MOBILE_MENU: {
      testId: 'mobile-menu',
      role: 'menu' as AriaRole,
      css: 'div[role="menu"], [aria-label*="mobile"]',
      description: 'Mobile navigation menu',
    },
  },

  // Authentication elements
  AUTH: {
    SIGN_IN_BUTTON: {
      testId: 'auth-button',
      text: /sign in|log in/i,
      role: { name: 'button', options: { name: /sign in|log in/i } },
      css: '[data-testid="auth-button"], button:has-text("Sign In")',
      description: 'Sign in button',
    },
    USER_PROFILE: {
      testId: 'user-profile',
      css: '[data-testid="user-profile"], a[href="/profile"]',
      description: 'User profile element',
    },
  },
};
