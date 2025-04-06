import { test, expect } from './utils/test-base';
import { ROUTES } from '../utils/routes';
import { waitForElementToBeVisible } from '../utils/selectors';

/**
 * Navigation and Layout Tests
 *
 * These tests verify the core structure of the application, including:
 * - Main layout elements are present
 * - Navigation works between key routes
 * - Responsive design works properly (desktop vs mobile)
 */
test.describe('Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Kill any potential service worker to prevent interference
    await page.addInitScript(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
    });

    // Start at the home page with proper waiting
    await page.goto(ROUTES.HOME, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for complete page initialization, using a more reliable approach than fixed timeouts
    await page.waitForFunction(() => document.readyState === 'complete', {
      timeout: 10000,
      polling: 'mutation',
    });
  });

  test('main layout should have key elements', async ({ page }) => {
    // Check for the core layout elements using our improved selectors utility
    const navbar = await waitForElementToBeVisible(page, 'LAYOUT.NAVBAR');
    const mainContent = await waitForElementToBeVisible(page, 'LAYOUT.MAIN_CONTENT');
    const footer = await waitForElementToBeVisible(page, 'LAYOUT.FOOTER');

    // Proper assertions that will give useful feedback on failure
    await expect(navbar, 'Navigation bar should be visible').toBeVisible();
    await expect(mainContent, 'Main content area should be visible').toBeVisible();
    await expect(footer, 'Footer should be visible').toBeVisible();

    // Check that the page title is set properly
    const title = await page.title();
    expect(title, 'Page should have a non-empty title').not.toBe('');

    // Document what we're looking for in the screenshot
    await page.screenshot({
      path: 'tests/e2e/screenshots/main-layout.png',
      fullPage: true,
    });
  });

  test('navigation links should work properly', async ({ page }) => {
    // Get navigation bar using our selector utility
    const navbar = await waitForElementToBeVisible(page, 'LAYOUT.NAVBAR');

    // Get all links within the navigation element
    const navLinks = navbar.locator('a');
    const linkCount = await navLinks.count();

    // Make sure we have navigation links
    expect(linkCount, 'Navigation should have at least 1 link').toBeGreaterThanOrEqual(1);

    // Test the first link - verify it navigates successfully
    if (linkCount > 0) {
      // Get link details
      const firstLink = navLinks.first();
      const linkText = await firstLink.textContent();
      const href = await firstLink.getAttribute('href');

      // Log what we're going to click for better test understanding
      console.log(`Testing navigation link: "${linkText}" with href "${href}"`);

      // Click the link and wait for navigation to complete
      await Promise.all([page.waitForNavigation({ timeout: 10000 }), firstLink.click()]);

      // Verify navigation was successful
      const currentUrl = page.url();
      expect(currentUrl, 'URL should change after clicking navigation link').toContain(href);

      // Check that the page content loaded properly
      const mainContent = await waitForElementToBeVisible(page, 'LAYOUT.MAIN_CONTENT');
      await expect(mainContent, 'Main content should be visible after navigation').toBeVisible();
    }
  });

  test('responsive design should work on mobile viewport', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if mobile menu button appears
    const mobileMenuButton = await page
      .getByRole('button', { name: /menu/i })
      .isVisible()
      .catch(() => false);

    // If the mobile menu button exists, test it
    if (mobileMenuButton) {
      const menuButton = page.getByRole('button', { name: /menu/i });

      // Verify mobile menu button is visible
      await expect(
        menuButton,
        'Mobile menu button should be visible on small viewport'
      ).toBeVisible();

      // Click the menu button to open mobile navigation
      await menuButton.click();

      // Wait for mobile menu to appear and verify it's visible
      const mobileMenu = await page
        .locator('[role="menu"], [aria-label*="mobile"]')
        .isVisible()
        .catch(() => false);

      if (mobileMenu) {
        const menu = page.locator('[role="menu"], [aria-label*="mobile"]');
        await expect(
          menu,
          'Mobile menu should be visible after clicking menu button'
        ).toBeVisible();

        // Take a screenshot to document mobile menu state
        await page.screenshot({
          path: 'tests/e2e/screenshots/mobile-menu-open.png',
        });
      } else {
        // Alternative: If no separate menu element, the links themselves might appear
        const navLinks = page.locator('nav a');
        const visibleLinks = await navLinks.filter({ hasText: /./ }).count();
        expect(
          visibleLinks,
          'Nav links should be visible after clicking menu button'
        ).toBeGreaterThan(0);
      }
    } else {
      // Alternative: If no mobile menu button, ensure the navigation is still accessible
      const navbar = await waitForElementToBeVisible(page, 'LAYOUT.NAVBAR');
      await expect(navbar, 'Navigation bar should still be visible on mobile').toBeVisible();

      // Log that the mobile menu button wasn't found (not necessarily an error)
      console.log('No mobile menu button found - site may use a different responsive pattern');
    }
  });

  test('navigation between key routes should work', async ({ page }) => {
    // Define key routes to test navigation between
    const routesToTest = [ROUTES.HOME, ROUTES.LOGIN];

    // Test navigation to each route
    for (const route of routesToTest) {
      // Navigate to the route
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      // Wait for the page to load with proper waiting
      await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });

      // Verify the URL matches the expected route
      const currentUrl = page.url();
      expect(currentUrl, `URL should match route: ${route}`).toContain(route);

      // Verify key page elements are present
      const mainContent = await waitForElementToBeVisible(page, 'LAYOUT.MAIN_CONTENT');
      await expect(mainContent, `Main content should be visible for route: ${route}`).toBeVisible();

      // Take a screenshot for documentation
      await page.screenshot({
        path: `tests/e2e/screenshots/route-${route.replace(/\//g, '-')}.png`,
        fullPage: true,
      });
    }
  });
});
