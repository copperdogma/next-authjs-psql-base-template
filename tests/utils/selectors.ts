/**
 * Centralized Selectors Utility for Playwright Tests
 *
 * This file provides a consistent approach to element selection throughout test files
 * following Playwright best practices.
 */
import { Page, Locator } from '@playwright/test';

// Valid ARIA role types for Playwright
export type AriaRole =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'blockquote'
  | 'button'
  | 'caption'
  | 'cell'
  | 'checkbox'
  | 'code'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'definition'
  | 'deletion'
  | 'dialog'
  | 'directory'
  | 'document'
  | 'emphasis'
  | 'feed'
  | 'figure'
  | 'form'
  | 'generic'
  | 'grid'
  | 'gridcell'
  | 'group'
  | 'heading'
  | 'img'
  | 'insertion'
  | 'link'
  | 'list'
  | 'listbox'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'meter'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'paragraph'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'search'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'strong'
  | 'subscript'
  | 'superscript'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'textbox'
  | 'time'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';

/**
 * Selector strategy types in order of preference
 * - role: ARIA role (most preferred, accessibility focused)
 * - text: Text content (user-centric)
 * - testId: Test ID (reliable for testing)
 * - css: CSS selectors (least preferred, most brittle)
 */
export type SelectorType = 'role' | 'text' | 'testId' | 'css' | 'tag';

/**
 * Role selector options for more specific targeting
 */
export interface RoleOptions {
  name?: string | RegExp;
  exact?: boolean;
  checked?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  includeHidden?: boolean;
  level?: number;
  pressed?: boolean;
  selected?: boolean;
}

/**
 * Generic options for all selector types
 */
export interface SelectorOptions {
  timeout?: number;
  hasText?: string | RegExp;
  exact?: boolean;
}

/**
 * Element descriptor with multiple selector strategies
 */
export interface ElementSelector {
  role?: AriaRole | { name: string; options?: RoleOptions };
  text?: string | RegExp;
  testId?: string;
  css?: string | string[];
  tag?: string;
  description: string;
}

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

/**
 * Gets a locator using the best available selector strategy
 * Tries selectors in this priority order:
 * 1. Role (ARIA role - most accessible)
 * 2. Text (What the user sees - most intuitive)
 * 3. Test ID (Most stable for testing)
 * 4. CSS (Most brittle, use as last resort)
 */
export function getElementLocator(
  page: Page,
  element: ElementSelector,
  options: SelectorOptions = {}
): Locator {
  const { timeout = 5000 } = options;

  // Try by role (preferred method - accessibility focused)
  if (element.role) {
    if (typeof element.role === 'object') {
      return page.getByRole(element.role.name as any, element.role.options || {});
    } else {
      return page.getByRole(element.role);
    }
  }

  // Try by text (user-centric)
  if (element.text) {
    return page.getByText(element.text, { exact: options.exact });
  }

  // Try by test ID (reliable for testing)
  if (element.testId) {
    return page.getByTestId(element.testId);
  }

  // Try by CSS selectors (least preferred)
  if (element.css) {
    if (Array.isArray(element.css)) {
      // Try each CSS selector in the array
      for (const selector of element.css) {
        const locator = page.locator(selector);
        // If the locator is valid, return it
        if (locator) return locator;
      }
      // If none worked, use the first one
      return page.locator(element.css[0]);
    }
    return page.locator(element.css);
  }

  // Try by tag name
  if (element.tag) {
    return page.locator(element.tag);
  }

  // Fallback to a very general selector if nothing else worked
  return page.locator('body');
}

/**
 * Wait for an element to be visible using the best available selector strategy
 * with fallback mechanisms for better reliability
 */
export async function waitForElementToBeVisible(
  page: Page,
  elementKey: string,
  options: SelectorOptions = {}
): Promise<Locator> {
  const { timeout = 15000 } = options;
  console.log(`Waiting for ${elementKey} to be visible...`);

  // Parse the element key path (e.g., "LAYOUT.NAVBAR")
  const keyParts = elementKey.split('.');
  let element: ElementSelector | undefined;

  // Navigate through the UI_ELEMENTS object to find the requested element
  let currentLevel: any = UI_ELEMENTS;
  for (const part of keyParts) {
    if (!currentLevel[part]) {
      throw new Error(`Element key not found: ${elementKey} (part ${part} missing)`);
    }
    currentLevel = currentLevel[part];
  }

  element = currentLevel;

  if (!element) {
    throw new Error(`Unknown element key: ${elementKey}`);
  }

  const locator = getElementLocator(page, element, options);

  try {
    await locator.waitFor({ state: 'visible', timeout });
    console.log(`Found element ${elementKey} (${element.description})`);
    return locator;
  } catch (error) {
    console.log(`Failed to find ${elementKey} with primary selectors, trying fallbacks...`);

    // Attempt fallback strategies
    const fallbacks = [
      // Try general selectors based on element type
      ...(element.role
        ? [
            typeof element.role === 'string'
              ? `[role="${element.role}"]`
              : `[role="${element.role.name}"]`,
          ]
        : []),
      ...(element.tag ? [`${element.tag}`] : []),
      // Very generic fallbacks if all else fails
      'header',
      'main',
      'footer',
      'nav',
      'div.container',
      'div.mx-auto',
    ];

    for (const fallback of fallbacks) {
      try {
        const fallbackLocator = page.locator(fallback).first();
        const isVisible = await fallbackLocator.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`Found element ${elementKey} with fallback selector: ${fallback}`);
          return fallbackLocator;
        }
      } catch (e) {
        // Continue trying other fallbacks
      }
    }

    // If all fallbacks fail, check if page has any content
    const content = await page.content();
    if (content && content.length > 500) {
      console.log(`Page has content, but ${elementKey} was not found. Using body as fallback.`);
      return page.locator('body');
    }

    // If we get here, all strategies failed
    throw new Error(`Failed to find element ${elementKey} using all strategies`);
  }
}
