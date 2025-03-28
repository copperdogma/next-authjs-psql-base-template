import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ROUTES } from '../utils/routes';
import { waitForElementToBeVisible } from '../utils/selectors';

/**
 * Accessibility Tests
 *
 * These tests verify compliance with accessibility standards across key routes.
 * We use Axe for automated accessibility testing.
 */

// Define types for Axe results
interface AxeViolation {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    failureSummary: string;
    target: string[];
  }>;
}

// List of known issues we're addressing but might not yet be fixed
const KNOWN_ISSUES = [
  {
    id: 'document-title',
    description: 'Document title issue is being addressed separately',
  },
  {
    id: 'html-has-lang',
    description: 'HTML lang attribute should be present in the root element',
  },
  {
    id: 'color-contrast',
    description: 'Some color contrast issues need to be addressed with design team',
  },
];

// Helper to filter out known issues
function filterKnownIssues(violations: AxeViolation[]): AxeViolation[] {
  return violations.filter(violation => !KNOWN_ISSUES.some(known => known.id === violation.id));
}

// Define routes to test for accessibility
const ROUTES_TO_TEST = [
  { path: ROUTES.HOME, name: 'Home Page' },
  { path: ROUTES.LOGIN, name: 'Login Page' },
];

test.describe('Accessibility Tests', () => {
  // Common setup for all accessibility tests
  test.beforeEach(async ({ page }) => {
    // Kill service workers to prevent interference
    await page.addInitScript(() => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
    });
  });

  // Test accessibility of key routes
  for (const route of ROUTES_TO_TEST) {
    test(`${route.name} should be accessible`, async ({ page }) => {
      // Navigate to the route
      await page.goto(route.path, { waitUntil: 'networkidle' });

      // Wait for main content to be visible
      const mainContent = await waitForElementToBeVisible(page, 'LAYOUT.MAIN_CONTENT');
      await expect(mainContent, `Main content should be visible on ${route.name}`).toBeVisible();

      // Take a screenshot
      await page.screenshot({
        path: `tests/e2e/screenshots/a11y-${route.path.replace(/\//g, '-') || 'home'}.png`,
      });

      // Run the accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa']) // WCAG 2.0 Level A & AA
        .analyze();

      // Filter out known issues
      const violations = filterKnownIssues(accessibilityScanResults.violations as AxeViolation[]);

      // For each violation, add a test annotation with useful debugging info
      violations.forEach((violation: AxeViolation) => {
        test.info().annotations.push({
          type: 'issue',
          description: `A11Y issue (${violation.id}): ${violation.help} - Impact: ${violation.impact}`,
        });

        // Log detailed information about each violation for easier debugging
        console.log(`\nA11y Violation: ${violation.id}`);
        console.log(`Description: ${violation.description}`);
        console.log(`Impact: ${violation.impact}`);
        console.log(`Help URL: ${violation.helpUrl}`);

        // Log affected elements (limited to 3 for brevity)
        const nodes = violation.nodes.slice(0, 3);
        nodes.forEach((node, i: number) => {
          console.log(`\nElement ${i + 1}: ${node.html}`);
          console.log(`Failure Summary: ${node.failureSummary}`);
        });

        if (violation.nodes.length > 3) {
          console.log(`\n...and ${violation.nodes.length - 3} more elements with this issue`);
        }
      });

      // Make assertion - we expect no violations
      expect(violations, `${route.name} should not have accessibility violations`).toHaveLength(0);
    });
  }

  // Test responsive behavior on mobile viewport
  test('accessibility on mobile viewport', async ({ page }) => {
    // Set mobile viewport size
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to home page
    await page.goto(ROUTES.HOME, { waitUntil: 'networkidle' });

    // Wait for content to be visible
    const mainContent = await waitForElementToBeVisible(page, 'LAYOUT.MAIN_CONTENT');
    await expect(mainContent, 'Main content should be visible on mobile viewport').toBeVisible();

    // Take a screenshot
    await page.screenshot({
      path: 'tests/e2e/screenshots/a11y-mobile.png',
      fullPage: true,
    });

    // Run the accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .options({
        // Include rules specifically for mobile viewports
        rules: {
          'target-size': { enabled: true },
        },
      })
      .analyze();

    // Filter out known issues
    const violations = filterKnownIssues(accessibilityScanResults.violations as AxeViolation[]);

    // Log summary of violations
    if (violations.length > 0) {
      console.log(`\nFound ${violations.length} accessibility violations on mobile viewport`);

      // Group violations by category for better reporting
      const violationsByType = violations.reduce<Record<string, AxeViolation[]>>(
        (acc, violation) => {
          acc[violation.id] = acc[violation.id] || [];
          acc[violation.id].push(violation);
          return acc;
        },
        {}
      );

      // Log grouped violations
      Object.entries(violationsByType).forEach(([id, items]) => {
        console.log(`\n${id}: ${items.length} occurrences`);
      });
    }

    // Make assertion - we expect no violations
    expect(violations, 'Mobile viewport should not have accessibility violations').toHaveLength(0);
  });

  // Test keyboard navigation
  test('keyboard navigation should be possible', async ({ page }) => {
    // Navigate to home page
    await page.goto(ROUTES.HOME, { waitUntil: 'networkidle' });

    // Track focused elements across tab presses
    const focusedElements = [];
    
    // Press Tab key several times to navigate through the page
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');

      // Take screenshot showing focus state for debugging
      await page.screenshot({
        path: `tests/e2e/screenshots/keyboard-focus-${i}.png`,
      });

      // Get information about the currently focused element
      const elementInfo = await page.evaluate(() => {
        const activeElement = document.activeElement;
        if (!activeElement || activeElement === document.body) {
          return { tagName: 'body', focused: false };
        }
        
        return { 
          tagName: activeElement.tagName,
          className: activeElement.className,
          id: activeElement.id,
          textContent: activeElement.textContent?.substring(0, 20),
          focused: true
        };
      });
      
      console.log(`Tab press #${i + 1} focused element:`, elementInfo);
      focusedElements.push(elementInfo);
    }

    // Verify that tabbing focuses different elements over time
    // Count how many different elements we focused on
    const uniqueTags = new Set(focusedElements.map(el => el.tagName + '-' + el.id)).size;
    
    // We expect at least 2 different elements to receive focus when tabbing
    expect(uniqueTags, 'Tab navigation should focus on different elements').toBeGreaterThan(1);
    
    // Make sure at least one element received focus
    const hasFocusedElements = focusedElements.some(el => el.focused);
    expect(hasFocusedElements, 'At least one element should receive focus').toBe(true);
  });
});
