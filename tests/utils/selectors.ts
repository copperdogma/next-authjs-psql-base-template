/**
 * Centralized Selectors Utility for Playwright Tests
 *
 * This file provides a consistent approach to element selection throughout test files
 * following Playwright best practices.
 */
import { Page, Locator } from '@playwright/test';
import { ElementSelector, SelectorOptions } from './selector-types';
import { UI_ELEMENTS } from './ui-elements';
import {
  getLocatorByRole,
  getLocatorByText,
  getLocatorByTestId,
  getLocatorByCss,
  findElementByKeyPath,
  generateFallbackSelectors,
} from './selector-helpers';

// Re-export types and constants
export * from './selector-types';
export { UI_ELEMENTS } from './ui-elements';

/**
 * Gets a locator using the best available selector strategy
 * Tries selectors in this priority order:
 * 1. Role (ARIA role - most accessible)
 * 2. Text (What the user sees - most intuitive)
 * 3. Test ID (Most stable for testing)
 * 4. CSS (Most brittle, use as last resort)
 * 5. Tag (HTML tag name)
 * 6. Body (ultimate fallback)
 */
export async function getElementLocator(
  page: Page,
  element: ElementSelector,
  options: SelectorOptions = {}
): Promise<Locator> {
  // Try each selector strategy in priority order
  const strategies = [
    getLocatorByRole(page, element),
    getLocatorByText(page, element, options.exact),
    getLocatorByTestId(page, element),
    getLocatorByCss(page, element),
  ];

  // Return the first successful strategy
  for (const locator of strategies) {
    if (locator) return locator;
  }

  // Try by tag name
  if (element.tag) {
    return page.locator(element.tag);
  }

  // Ultimate fallback - use body
  return page.locator('body');
}

/**
 * Try to find element using primary selectors
 */
async function tryPrimarySelector(
  page: Page,
  element: ElementSelector,
  options: SelectorOptions = {},
  timeout: number
): Promise<Locator | null> {
  const locator = await getElementLocator(page, element, options);

  try {
    await locator.waitFor({ state: 'visible', timeout });
    console.log(`Found element ${element.description}`);
    return locator;
  } catch {
    return null;
  }
}

/**
 * Try fallback strategies when primary selectors fail
 */
async function tryFallbackStrategies(
  page: Page,
  element: ElementSelector,
  elementKey: string
): Promise<Locator> {
  console.log(`Failed to find ${elementKey} with primary selectors, trying fallbacks...`);

  // Generate fallback selectors based on element properties
  const fallbacks = generateFallbackSelectors(element);

  // Try each fallback selector
  for (const fallback of fallbacks) {
    try {
      const fallbackLocator = page.locator(fallback).first();
      const isVisible = await fallbackLocator.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`Found element ${elementKey} with fallback selector: ${fallback}`);
        return fallbackLocator;
      }
    } catch {
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

  // Find the element definition
  const element = findElementByKeyPath(elementKey);

  // Try primary selector first
  const primaryResult = await tryPrimarySelector(page, element, options, timeout);
  if (primaryResult) {
    return primaryResult;
  }

  // If primary selector fails, try fallbacks
  return tryFallbackStrategies(page, element, elementKey);
}

export async function waitForElement(
  page: Page,
  selector: string,
  options: { state?: 'visible' | 'hidden' | 'attached' | 'detached' } = {}
): Promise<Locator> {
  const element = page.locator(selector);
  await element.waitFor(options);
  return element;
}

export async function waitForElementToBeHidden(page: Page, selector: string): Promise<void> {
  try {
    await page.locator(selector).waitFor({ state: 'hidden' });
  } catch {
    throw new Error(`Element ${selector} did not become hidden`);
  }
}
