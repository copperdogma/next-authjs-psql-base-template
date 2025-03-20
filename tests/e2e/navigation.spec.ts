import { test, expect, Page } from '@playwright/test';
import { TEST_CONFIG, ROUTES } from '../utils/routes';

// Centralize UI element selectors for easier maintenance
const UI_ELEMENTS = {
  NAVBAR: {
    testId: 'navbar',
    role: 'navigation',
    tag: 'nav',
    css: 'header nav'
  },
  MAIN_CONTENT: {
    testId: 'main-content',
    role: 'main',
    tag: 'main',
    css: '.flex-grow'
  },
  FOOTER: {
    testId: 'footer',
    role: 'contentinfo',
    tag: 'footer',
    css: 'footer'
  },
  DESKTOP_MENU: {
    testId: 'desktop-menu',
    css: [
      'nav div[class*="hidden md:flex"]',
      'nav .hidden.md\\:flex'
    ]
  },
  MOBILE_MENU_BUTTON: {
    testId: 'mobile-menu-button',
    role: { name: 'button', options: { name: 'Main menu' } },
    css: 'button[aria-label="Main menu"]'
  },
  MOBILE_MENU: {
    testId: 'mobile-menu',
    role: 'menu',
    css: 'div[role="menu"]'
  }
};

// Define types for our selector strategies
interface SelectorStrategy {
  type: 'testId' | 'role' | 'tag' | 'css';
  selector: string;
  options?: Record<string, any>;
}

/**
 * More comprehensive helper to make element waiting more resilient
 * This tries multiple selector strategies to find elements
 */
async function waitForElementToBeVisible(page: Page, elementKey: string, options: Record<string, any> = {}) {
  const defaultOptions = { timeout: 15000, message: `Waiting for ${elementKey}` };
  const opts = { ...defaultOptions, ...options };
  
  console.log(opts.message);
  
  // Get element configuration from our centralized UI_ELEMENTS
  const elementConfig = (UI_ELEMENTS as Record<string, any>)[elementKey];
  
  if (!elementConfig) {
    throw new Error(`Unknown element key: ${elementKey}`);
  }
  
  // Try by test ID first
  if (elementConfig.testId) {
    try {
      await page.getByTestId(elementConfig.testId).waitFor({ state: 'visible', timeout: opts.timeout / 3 });
      console.log(`Found element ${elementKey} with testId: ${elementConfig.testId}`);
      return true;
    } catch (error) {
      console.log(`Failed to find with testId ${elementConfig.testId}, trying alternatives...`);
    }
  }
  
  // Try by role
  if (elementConfig.role) {
    try {
      if (typeof elementConfig.role === 'object') {
        await page.getByRole(elementConfig.role.name, elementConfig.role.options).waitFor({ 
          state: 'visible', 
          timeout: opts.timeout / 3 
        });
      } else {
        await page.getByRole(elementConfig.role).waitFor({ 
          state: 'visible', 
          timeout: opts.timeout / 3 
        });
      }
      console.log(`Found element ${elementKey} with role selector`);
      return true;
    } catch (error) {
      console.log(`Failed to find with role selector, trying next strategy...`);
    }
  }
  
  // Try by tag
  if (elementConfig.tag) {
    try {
      await page.locator(elementConfig.tag).first().waitFor({ 
        state: 'visible', 
        timeout: opts.timeout / 3 
      });
      console.log(`Found element ${elementKey} with tag: ${elementConfig.tag}`);
      return true;
    } catch (error) {
      console.log(`Failed to find with tag ${elementConfig.tag}, trying next strategy...`);
    }
  }
  
  // Try by CSS selectors
  if (elementConfig.css) {
    const cssSelectors = Array.isArray(elementConfig.css) ? elementConfig.css : [elementConfig.css];
    
    for (const selector of cssSelectors) {
      try {
        await page.locator(selector).first().waitFor({ 
          state: 'visible', 
          timeout: opts.timeout / cssSelectors.length 
        });
        console.log(`Found element ${elementKey} with CSS: ${selector}`);
        return true;
      } catch (error) {
        console.log(`Failed with CSS selector: ${selector}`);
      }
    }
  }
  
  // If we get here, all strategies failed
  throw new Error(`Failed to find element ${elementKey} using all strategies`);
}

// Mark this test suite as slow to allow more time for execution
test.describe.configure({ mode: 'serial', timeout: 120000 });

test.describe('Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Starting navigation test - navigating to home page');
    
    // Kill any potential service worker that might interfere
    await page.addInitScript(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
    });
    
    // Start at the home page with longer timeout and better waiting
    await page.goto(ROUTES.HOME, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Give the page a moment to initialize JavaScript
    console.log('Waiting for initial JavaScript initialization');
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('Navigation complete, checking for navbar...');
    // Wait for critical elements with fallbacks
    await waitForElementToBeVisible(page, 'NAVBAR', {
      message: 'Waiting for navbar to be visible'
    });
  });
  
  test('main layout should have key elements', async ({ page }) => {
    // Check for header/navigation
    await waitForElementToBeVisible(page, 'NAVBAR');
    
    // Check for main content area
    await waitForElementToBeVisible(page, 'MAIN_CONTENT');
    
    // Check for footer
    await waitForElementToBeVisible(page, 'FOOTER');

    // Verify elements are visible via roles as well
    await expect(page.getByRole('banner')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('main')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('contentinfo')).toBeVisible({ timeout: 5000 });
  });
  
  test('mobile responsiveness check', async ({ page }) => {
    console.log('Setting desktop viewport');
    // Set desktop viewport first
    await page.setViewportSize(TEST_CONFIG.VIEWPORT.DESKTOP);
    
    // Wait for viewport change to take effect
    await page.waitForTimeout(1000);
    
    // Try to find desktop menu using multiple strategies
    console.log('Checking desktop menu visibility');
    await waitForElementToBeVisible(page, 'DESKTOP_MENU');
    
    // Get locators for desktop and mobile elements
    const desktopMenu = page.getByTestId(UI_ELEMENTS.DESKTOP_MENU.testId);
    const mobileMenuButton = page.getByTestId(UI_ELEMENTS.MOBILE_MENU_BUTTON.testId);
    const mobileMenu = page.getByTestId(UI_ELEMENTS.MOBILE_MENU.testId);
    
    // Check desktop visibility states
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });
    // In desktop view, mobile menu button should exist but be hidden via CSS
    await expect(mobileMenuButton).toHaveClass(/md:hidden/, { timeout: 5000 });
    // Mobile menu should not be visible
    await expect(mobileMenu).toBeHidden({ timeout: 5000 });
    
    console.log('Setting mobile viewport');
    // Switch to mobile viewport
    await page.setViewportSize(TEST_CONFIG.VIEWPORT.MOBILE);
    
    // Wait for viewport change to take effect
    await page.waitForTimeout(1000);
    
    console.log('Checking mobile menu button visibility');
    // Mobile menu button should be visible, desktop menu should be hidden
    await expect(mobileMenuButton).toBeVisible({ timeout: 5000 });
    await expect(desktopMenu).toBeHidden({ timeout: 5000 });
    
    // Test mobile menu functionality
    console.log('Testing mobile menu interaction');
    // Initially, mobile menu should be hidden
    await expect(mobileMenu).toBeHidden({ timeout: 5000 });
    
    // Click the mobile menu button
    await mobileMenuButton.click();
    
    // Mobile menu should now be visible
    await expect(mobileMenu).toBeVisible({ timeout: 5000 });
    
    // Verify menu items are visible
    await expect(page.getByRole('menuitem', { name: 'Home' })).toBeVisible({ timeout: 5000 });
    
    // Click the button again to close
    await mobileMenuButton.click();
    
    // Mobile menu should be hidden again
    await expect(mobileMenu).toBeHidden({ timeout: 5000 });
    
    // Verify we can still access navigation elements even without the mobile menu
    await expect(page.getByRole('banner')).toBeVisible({ timeout: 5000 });
    
    console.log('Test completed successfully');
  });
}); 