import { test, expect, Page } from '@playwright/test';

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
async function waitForElementToBeVisible(page: Page, selector: string, options: Record<string, any> = {}) {
  const defaultOptions = { timeout: 15000, message: `Waiting for ${selector}` };
  const opts = { ...defaultOptions, ...options };
  
  console.log(opts.message);
  
  // Define all possible ways to find the element
  const selectorStrategies: Record<string, SelectorStrategy[]> = {
    '[data-testid="navbar"]': [
      { type: 'testId', selector: 'navbar' },
      { type: 'role', selector: 'navigation' },
      { type: 'tag', selector: 'nav' },
      { type: 'css', selector: 'header nav' }
    ],
    '[data-testid="main-content"]': [
      { type: 'testId', selector: 'main-content' },
      { type: 'role', selector: 'main' },
      { type: 'tag', selector: 'main' },
      { type: 'css', selector: '.flex-grow' }
    ],
    '[data-testid="footer"]': [
      { type: 'testId', selector: 'footer' },
      { type: 'role', selector: 'contentinfo' },
      { type: 'tag', selector: 'footer' },
      { type: 'css', selector: 'footer' }
    ],
    '[data-testid="desktop-menu"]': [
      { type: 'testId', selector: 'desktop-menu' },
      { type: 'css', selector: 'nav div[class*="hidden md:flex"]' },
      { type: 'css', selector: 'nav .hidden.md\\:flex' }
    ],
    '[data-testid="mobile-menu-button"]': [
      { type: 'testId', selector: 'mobile-menu-button' },
      { type: 'role', selector: 'button', options: { name: 'Main menu' } },
      { type: 'css', selector: 'button[aria-label="Main menu"]' }
    ],
    '[data-testid="mobile-menu"]': [
      { type: 'testId', selector: 'mobile-menu' },
      { type: 'role', selector: 'menu' },
      { type: 'css', selector: 'div[role="menu"]' }
    ]
  };
  
  // Get the strategies for this selector, or use an empty array if not defined
  const strategies = selectorStrategies[selector] || [];
  
  // Try the original selector first
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: opts.timeout / 3 });
    return true;
  } catch (error) {
    console.log(`Failed to find with direct selector ${selector}, trying alternatives...`);
  }
  
  // Try all the alternative selectors
  for (const strategy of strategies) {
    try {
      console.log(`Trying ${strategy.type} strategy with selector: ${strategy.selector}`);
      
      switch (strategy.type) {
        case 'testId':
          await page.getByTestId(strategy.selector).waitFor({ state: 'visible', timeout: opts.timeout / strategies.length });
          console.log(`Found with testId: ${strategy.selector}`);
          return true;
        case 'role':
          if (strategy.options) {
            await page.getByRole(strategy.selector as any, strategy.options).waitFor({ state: 'visible', timeout: opts.timeout / strategies.length });
          } else {
            await page.getByRole(strategy.selector as any).waitFor({ state: 'visible', timeout: opts.timeout / strategies.length });
          }
          console.log(`Found with role: ${strategy.selector}`);
          return true;
        case 'tag':
        case 'css':
          await page.locator(strategy.selector).waitFor({ state: 'visible', timeout: opts.timeout / strategies.length });
          console.log(`Found with ${strategy.type}: ${strategy.selector}`);
          return true;
      }
    } catch (error) {
      console.log(`Failed with ${strategy.type} strategy: ${strategy.selector}`);
      // Continue to the next strategy
    }
  }
  
  // If we get here, all strategies failed
  throw new Error(`Failed to find element with selector ${selector} using all strategies`);
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
    
    // Start at the home page and wait for network idle
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for Next.js hydration to complete
    await page.waitForFunction(() => {
      return document.readyState === 'complete' && 
             document.body.classList.length > 0;
    }, { timeout: 30000 });

    console.log('Navigation complete, checking for navbar...');
  });
  
  test('main layout should have key elements', async ({ page }) => {
    // Wait for critical elements with increased timeout
    await page.waitForSelector('header', { state: 'visible', timeout: 30000 });
    await page.waitForSelector('main', { state: 'visible', timeout: 30000 });
    await page.waitForSelector('footer', { state: 'visible', timeout: 30000 });

    // Verify elements are visible via roles as well with increased timeout
    await expect(page.getByRole('banner')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('main')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('contentinfo')).toBeVisible({ timeout: 30000 });
  });
  
  test('mobile responsiveness check', async ({ page }) => {
    console.log('Setting desktop viewport');
    // Set desktop viewport first
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Wait for viewport change to take effect
    await page.waitForTimeout(1000);
    
    // Try to find desktop menu using multiple strategies
    console.log('Checking desktop menu visibility');
    await waitForElementToBeVisible(page, '[data-testid="desktop-menu"]');
    
    // Get locators for desktop and mobile elements
    const desktopMenu = page.getByTestId('desktop-menu');
    const mobileMenuButton = page.getByTestId('mobile-menu-button');
    const mobileMenu = page.getByTestId('mobile-menu');
    
    // Check desktop visibility states
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });
    // In desktop view, mobile menu button should exist but be hidden via CSS
    await expect(mobileMenuButton).toHaveClass(/md:hidden/, { timeout: 5000 });
    // Mobile menu should not be visible
    await expect(mobileMenu).toBeHidden({ timeout: 5000 });
    
    console.log('Setting mobile viewport');
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
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