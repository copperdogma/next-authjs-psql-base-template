/**
 * Helper functions for element selection
 * Extracted from selectors.ts to reduce file size
 */
import { Page, Locator } from '@playwright/test';
import { ElementSelector, SelectorOptions } from './selector-types';
import { UI_ELEMENTS } from './ui-elements';

/**
 * Gets a locator for an element based on its role
 */
export function getLocatorByRole(page: Page, element: ElementSelector): Locator | null {
  if (!element.role) return null;

  if (typeof element.role === 'object') {
    return page.getByRole(element.role.name as any, element.role.options || {});
  } else {
    return page.getByRole(element.role);
  }
}

/**
 * Gets a locator for an element based on its text content
 */
export function getLocatorByText(
  page: Page,
  element: ElementSelector,
  exact?: boolean
): Locator | null {
  if (!element.text) return null;
  return page.getByText(element.text, { exact });
}

/**
 * Gets a locator for an element based on its test ID
 */
export function getLocatorByTestId(page: Page, element: ElementSelector): Locator | null {
  if (!element.testId) return null;
  return page.getByTestId(element.testId);
}

/**
 * Gets a locator for an element based on CSS selectors
 */
export function getLocatorByCss(page: Page, element: ElementSelector): Locator | null {
  if (!element.css) return null;

  if (Array.isArray(element.css)) {
    // Use the first selector as default
    return page.locator(element.css[0]);
  }
  return page.locator(element.css);
}

/**
 * Generate fallback selectors based on element properties
 */
export function generateFallbackSelectors(element: ElementSelector): string[] {
  const roleSelectors = element.role
    ? [
        typeof element.role === 'string'
          ? `[role="${element.role}"]`
          : `[role="${element.role.name}"]`,
      ]
    : [];

  const tagSelectors = element.tag ? [`${element.tag}`] : [];

  // Very generic fallbacks if all else fails
  const genericFallbacks = ['header', 'main', 'footer', 'nav', 'div.container', 'div.mx-auto'];

  return [...roleSelectors, ...tagSelectors, ...genericFallbacks];
}

/**
 * Find an element in the UI_ELEMENTS map based on a dot-notation key path
 */
export function findElementByKeyPath(elementKey: string): ElementSelector {
  // Parse the element key path (e.g., "LAYOUT.NAVBAR")
  const keyParts = elementKey.split('.');

  // Navigate through the UI_ELEMENTS object to find the requested element
  let currentLevel: any = UI_ELEMENTS;
  for (const part of keyParts) {
    if (!currentLevel[part]) {
      throw new Error(`Element key not found: ${elementKey} (part ${part} missing)`);
    }
    currentLevel = currentLevel[part];
  }

  if (!currentLevel) {
    throw new Error(`Unknown element key: ${elementKey}`);
  }

  return currentLevel;
}
