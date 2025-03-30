import { test, expect } from '@playwright/test';

/**
 * Helper function to check if a color is dark based on its RGB values
 */
function isDarkColor(rgbColor: string): boolean {
  // Parse RGB values
  const match = rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return false;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  // Calculate luminance - simplified formula
  // (0.299*R + 0.587*G + 0.114*B)
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  // If luminance < 128, consider it a dark color
  return luminance < 128;
}

/**
 * Theme toggle E2E test - captures the state of the theme toggle
 * before and after clicking to visualize the behavior
 */
test('theme toggle should cycle through themes correctly', async ({ page }) => {
  // Navigate to home page
  await page.goto('/');

  // Function to get tooltip content (Material UI tooltips aren't standard title attributes)
  async function getTooltipContent() {
    // Hover over the button to show the tooltip
    await page.hover('[data-testid="theme-toggle"]');
    await page.waitForTimeout(400); // Wait for tooltip to appear (needs to exceed enterDelay=300)

    // Material UI renders tooltips in a separate div with role="tooltip"
    try {
      const tooltip = await page.waitForSelector('div[role="tooltip"]', { timeout: 1000 });
      return await tooltip.textContent();
    } catch {
      return 'No tooltip found';
    }
  }

  // Function to check the actual theme applied to the page
  async function getAppliedTheme() {
    // Check data-mode attribute on HTML element
    const dataMode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-mode');
    });

    // Check background colors for main elements to determine if using dark theme
    const colors = await page.evaluate(() => {
      const styles = {
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        bodyColor: window.getComputedStyle(document.body).color,
        appBarBg: window.getComputedStyle(document.querySelector('header')!).backgroundColor,
        cardBg: window.getComputedStyle(document.querySelector('.MuiPaper-root')!).backgroundColor,
      };
      return styles;
    });

    // Determine if visually dark theme
    const isVisuallyDark = isDarkColor(colors.bodyBg) || isDarkColor(colors.appBarBg);

    // Log both the attribute and the background color
    console.log(`Applied theme - data-mode: ${dataMode || 'not set'}`);
    console.log(`Colors - body: ${colors.bodyBg}, header: ${colors.appBarBg}`);
    console.log(`Is visually dark: ${isVisuallyDark}`);

    return {
      dataMode,
      colors,
      isVisuallyDark,
    };
  }

  // Step 1: Take initial screenshot and check tooltip
  await page.waitForSelector('[data-testid="theme-toggle"]');
  await page.screenshot({ path: 'screenshots/theme-toggle-initial.png' });
  const initialTooltip = await getTooltipContent();
  const initialTheme = await getAppliedTheme();
  console.log(`Initial tooltip text: ${initialTooltip}`);

  // Get current icon
  const initialIsDarkIcon = (await page.locator('[data-testid="DarkModeIcon"]').count()) > 0;
  const initialIsLightIcon = (await page.locator('[data-testid="LightModeIcon"]').count()) > 0;
  const initialIsAutoIcon = (await page.locator('[data-testid="BrightnessAutoIcon"]').count()) > 0;
  const initialIcon = initialIsDarkIcon
    ? 'Dark'
    : initialIsLightIcon
      ? 'Light'
      : initialIsAutoIcon
        ? 'Auto'
        : 'Unknown';

  console.log(
    `Initial icon: ${initialIcon}, Visual theme: ${initialTheme.isVisuallyDark ? 'Dark' : 'Light'}`
  );

  // Step 2: Click the toggle and take screenshot for first change
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForTimeout(800); // Wait for transitions
  await page.screenshot({ path: 'screenshots/theme-toggle-after-first-click.png' });
  const tooltipAfterFirstClick = await getTooltipContent();
  const themeAfterFirstClick = await getAppliedTheme();

  // Get current icon
  const firstClickIsDarkIcon = (await page.locator('[data-testid="DarkModeIcon"]').count()) > 0;
  const firstClickIsLightIcon = (await page.locator('[data-testid="LightModeIcon"]').count()) > 0;
  const firstClickIsAutoIcon =
    (await page.locator('[data-testid="BrightnessAutoIcon"]').count()) > 0;
  const firstClickIcon = firstClickIsDarkIcon
    ? 'Dark'
    : firstClickIsLightIcon
      ? 'Light'
      : firstClickIsAutoIcon
        ? 'Auto'
        : 'Unknown';

  console.log(
    `First click icon: ${firstClickIcon}, Visual theme: ${themeAfterFirstClick.isVisuallyDark ? 'Dark' : 'Light'}`
  );
  console.log(`Tooltip after first click: ${tooltipAfterFirstClick}`);

  // Step 3: Click the toggle again and take screenshot for second change
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForTimeout(800); // Wait for transitions
  await page.screenshot({ path: 'screenshots/theme-toggle-after-second-click.png' });
  const tooltipAfterSecondClick = await getTooltipContent();
  const themeAfterSecondClick = await getAppliedTheme();

  // Get current icon
  const secondClickIsDarkIcon = (await page.locator('[data-testid="DarkModeIcon"]').count()) > 0;
  const secondClickIsLightIcon = (await page.locator('[data-testid="LightModeIcon"]').count()) > 0;
  const secondClickIsAutoIcon =
    (await page.locator('[data-testid="BrightnessAutoIcon"]').count()) > 0;
  const secondClickIcon = secondClickIsDarkIcon
    ? 'Dark'
    : secondClickIsLightIcon
      ? 'Light'
      : secondClickIsAutoIcon
        ? 'Auto'
        : 'Unknown';

  console.log(
    `Second click icon: ${secondClickIcon}, Visual theme: ${themeAfterSecondClick.isVisuallyDark ? 'Dark' : 'Light'}`
  );
  console.log(`Tooltip after second click: ${tooltipAfterSecondClick}`);

  // Step 4: Click the toggle one more time and take screenshot for third change
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForTimeout(800); // Wait for transitions
  await page.screenshot({ path: 'screenshots/theme-toggle-after-third-click.png' });
  const tooltipAfterThirdClick = await getTooltipContent();
  const themeAfterThirdClick = await getAppliedTheme();

  // Get current icon
  const thirdClickIsDarkIcon = (await page.locator('[data-testid="DarkModeIcon"]').count()) > 0;
  const thirdClickIsLightIcon = (await page.locator('[data-testid="LightModeIcon"]').count()) > 0;
  const thirdClickIsAutoIcon =
    (await page.locator('[data-testid="BrightnessAutoIcon"]').count()) > 0;
  const thirdClickIcon = thirdClickIsDarkIcon
    ? 'Dark'
    : thirdClickIsLightIcon
      ? 'Light'
      : thirdClickIsAutoIcon
        ? 'Auto'
        : 'Unknown';

  console.log(
    `Third click icon: ${thirdClickIcon}, Visual theme: ${themeAfterThirdClick.isVisuallyDark ? 'Dark' : 'Light'}`
  );
  console.log(`Tooltip after third click: ${tooltipAfterThirdClick}`);

  // Verify theme matches icon
  if (thirdClickIsDarkIcon) {
    expect(themeAfterThirdClick.isVisuallyDark).toBe(true);
  } else if (thirdClickIsLightIcon) {
    expect(themeAfterThirdClick.isVisuallyDark).toBe(false);
  }
});

/**
 * Detailed test to capture both icon and tooltip for each theme state
 */
test('should show correct icon and tooltip for each theme state', async ({ page }) => {
  await page.goto('/');

  // Helper function to capture current state
  async function captureState(stepName: string) {
    await page.waitForTimeout(500); // Wait for transitions

    // Take screenshot
    await page.screenshot({ path: `screenshots/theme-toggle-${stepName}.png` });

    // Get tooltip content by hovering
    await page.hover('[data-testid="theme-toggle"]');
    await page.waitForTimeout(400); // Wait for tooltip to appear

    let tooltipText = 'No tooltip found';
    try {
      const tooltip = await page.waitForSelector('div[role="tooltip"]', { timeout: 1000 });
      tooltipText = (await tooltip.textContent()) || 'Empty tooltip';
    } catch {
      // Tooltip not found
    }

    // Check which icon is displayed
    const hasDarkIcon = (await page.locator('[data-testid="DarkModeIcon"]').count()) > 0;
    const hasLightIcon = (await page.locator('[data-testid="LightModeIcon"]').count()) > 0;
    const hasAutoIcon = (await page.locator('[data-testid="BrightnessAutoIcon"]').count()) > 0;

    // Get the actual theme
    const dataMode = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-mode');
    });

    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    console.log(`State ${stepName}:`);
    console.log(`- Tooltip: ${tooltipText}`);
    console.log(`- Has dark icon: ${hasDarkIcon}`);
    console.log(`- Has light icon: ${hasLightIcon}`);
    console.log(`- Has auto icon: ${hasAutoIcon}`);
    console.log(`- Applied theme (data-mode): ${dataMode || 'not set'}`);
    console.log(`- Background color: ${bgColor}`);

    return {
      tooltipText,
      hasDarkIcon,
      hasLightIcon,
      hasAutoIcon,
      dataMode,
      bgColor,
    };
  }

  // Cycle through all theme states
  await page.waitForSelector('[data-testid="theme-toggle"]');

  // Initial state
  const state1 = await captureState('state1');

  // Verify icon matches theme
  if (state1.hasDarkIcon) {
    expect(state1.dataMode).toBe('dark');
  } else if (state1.hasLightIcon) {
    expect(state1.dataMode).toBe('light');
  }

  // Click once
  await page.click('[data-testid="theme-toggle"]');
  const state2 = await captureState('state2');

  // Verify icon matches theme
  if (state2.hasDarkIcon) {
    expect(state2.dataMode).toBe('dark');
  } else if (state2.hasLightIcon) {
    expect(state2.dataMode).toBe('light');
  }

  // Click twice
  await page.click('[data-testid="theme-toggle"]');
  const state3 = await captureState('state3');

  // Verify icon matches theme
  if (state3.hasDarkIcon) {
    expect(state3.dataMode).toBe('dark');
  } else if (state3.hasLightIcon) {
    expect(state3.dataMode).toBe('light');
  }

  // Click three times (back to initial state)
  await page.click('[data-testid="theme-toggle"]');
  const state4 = await captureState('state4');

  // Verify we're back at the initial state
  expect(state1.tooltipText).toEqual(state4.tooltipText);
  expect(state1.hasDarkIcon).toEqual(state4.hasDarkIcon);
  expect(state1.hasLightIcon).toEqual(state4.hasLightIcon);
  expect(state1.hasAutoIcon).toEqual(state4.hasAutoIcon);
  expect(state1.dataMode).toEqual(state4.dataMode);
});
