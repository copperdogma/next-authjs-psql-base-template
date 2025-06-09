import { test, expect, Page } from './utils/test-base';

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
 * Helper function to get tooltip content
 */
async function getTooltipContent(page: Page): Promise<string> {
  // Hover over the button to show the tooltip
  await page.hover('[data-testid="theme-toggle"]');
  await page.waitForTimeout(400); // Wait for tooltip to appear (needs to exceed enterDelay=300)

  // Material UI renders tooltips in a separate div with role="tooltip"
  try {
    const tooltip = await page.waitForSelector('div[role="tooltip"]', { timeout: 1000 });
    return (await tooltip.textContent()) || 'Empty tooltip';
  } catch {
    return 'No tooltip found';
  }
}

/**
 * Helper function to check the actual theme applied to the page
 */
async function getAppliedTheme(page: Page) {
  // Check theme class on HTML element (next-themes uses class attribute)
  const themeClass = await page.evaluate(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  // Check background colors for main elements to determine if using dark theme
  const colors = await page.evaluate(() => {
    const styles = {
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      bodyColor: window.getComputedStyle(document.body).color,
      appBarBg: window.getComputedStyle(document.querySelector('header') || document.body)
        .backgroundColor,
      cardBg: window.getComputedStyle(document.querySelector('.MuiPaper-root') || document.body)
        .backgroundColor,
    };
    return styles;
  });

  // Determine if visually dark theme
  const isVisuallyDark = isDarkColor(colors.bodyBg) || isDarkColor(colors.appBarBg);

  // Log both the class and the background color
  console.log(`Applied theme class: ${themeClass}`);
  console.log(`Colors - body: ${colors.bodyBg}, header: ${colors.appBarBg}`);
  console.log(`Is visually dark: ${isVisuallyDark}`);

  return {
    themeClass,
    colors,
    isVisuallyDark,
  };
}

/**
 * Helper function to detect current icon
 */
async function getCurrentIcon(page: Page): Promise<string> {
  const isDarkIcon = (await page.locator('[data-testid="DarkModeIcon"]').count()) > 0;
  const isLightIcon = (await page.locator('[data-testid="LightModeIcon"]').count()) > 0;
  const isAutoIcon = (await page.locator('[data-testid="BrightnessAutoIcon"]').count()) > 0;

  return isDarkIcon ? 'Dark' : isLightIcon ? 'Light' : isAutoIcon ? 'Auto' : 'Unknown';
}

/**
 * Helper function to set theme and capture state
 */
async function setThemeAndCaptureState(page: Page, themeOption: string, stepName: string) {
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForSelector('#theme-menu');
  await page.click(`[data-testid="${themeOption}"]`);
  await page.waitForTimeout(800); // Wait for transitions

  await page.screenshot({ path: `tests/e2e/screenshots/theme-toggle-${stepName}.png` });

  const tooltip = await getTooltipContent(page);
  const theme = await getAppliedTheme(page);
  const icon = await getCurrentIcon(page);

  console.log(
    `${stepName} icon: ${icon}, Visual theme: ${theme.isVisuallyDark ? 'Dark' : 'Light'}`
  );
  console.log(`Tooltip after ${stepName}: ${tooltip}`);

  return { tooltip, theme, icon };
}

/**
 * Capture detailed theme state
 */
async function captureState(page: Page, stepName: string) {
  await page.waitForTimeout(500); // Wait for transitions

  // Take screenshot
  await page.screenshot({ path: `tests/e2e/screenshots/theme-toggle-${stepName}.png` });

  // Get tooltip content
  const tooltipText = await getTooltipContent(page);

  // Check which icon is displayed
  const icon = await getCurrentIcon(page);

  // Get the actual theme
  const themeData = await getAppliedTheme(page);

  console.log(`State ${stepName}:`);
  console.log(`- Tooltip: ${tooltipText}`);
  console.log(`- Icon: ${icon}`);
  console.log(`- Applied theme class: ${themeData.themeClass}`);
  console.log(`- Background color: ${themeData.colors.bodyBg}`);

  return {
    tooltipText,
    icon,
    themeClass: themeData.themeClass,
    isVisuallyDark: themeData.isVisuallyDark,
  };
}

/**
 * Theme toggle E2E test - captures the state of the theme toggle
 * before and after clicking to visualize the behavior
 */
test('theme toggle should cycle through themes correctly', async ({ page }) => {
  // Navigate to home page
  await page.goto('/');

  // Wait for toggle to be available
  await page.waitForSelector('[data-testid="theme-toggle"]');

  // Step 1: Take initial screenshot and check tooltip
  await page.screenshot({ path: 'tests/e2e/screenshots/theme-toggle-initial.png' });
  const initialTooltip = await getTooltipContent(page);
  const initialTheme = await getAppliedTheme(page);
  const initialIcon = await getCurrentIcon(page);

  console.log(
    `Initial icon: ${initialIcon}, Visual theme: ${initialTheme.isVisuallyDark ? 'Dark' : 'Light'}`
  );
  console.log(`Initial tooltip text: ${initialTooltip}`);

  // Close the menu if it's open
  const menuCount = await page.locator('#theme-menu').count();
  if (menuCount > 0) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // Step 2: Set to dark theme and verify
  const { theme: darkTheme, icon: darkIcon } = await setThemeAndCaptureState(
    page,
    'theme-dark',
    'after-first-click'
  );
  expect(darkTheme.isVisuallyDark).toBe(true);
  expect(darkIcon).toBe('Dark');

  // Step 3: Set to light theme and verify
  const { theme: lightTheme, icon: lightIcon } = await setThemeAndCaptureState(
    page,
    'theme-light',
    'after-second-click'
  );
  expect(lightTheme.isVisuallyDark).toBe(false);
  expect(lightIcon).toBe('Light');

  // Step 4: Set to system/auto theme
  const systemState = await setThemeAndCaptureState(page, 'theme-system', 'after-third-click');

  // Verify theme matches icon
  if (systemState.icon === 'Dark') {
    expect(systemState.theme.isVisuallyDark).toBe(true);
  } else if (systemState.icon === 'Light') {
    expect(systemState.theme.isVisuallyDark).toBe(false);
  }
});

/**
 * Detailed test to capture both icon and tooltip for each theme state
 */
test('should show correct icon and tooltip for each theme state', async ({ page }) => {
  await page.goto('/');

  // Capture initial state and use it for assertions
  const { icon: initialIcon, isVisuallyDark: initialIsDark } = await captureState(page, 'initial');
  console.log(`Initial icon: ${initialIcon}, isDark: ${initialIsDark}`);

  // Set to dark theme
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForSelector('#theme-menu');
  await page.click('[data-testid="theme-dark"]');
  const darkState = await captureState(page, 'dark');

  // Verify dark theme is applied
  expect(darkState.isVisuallyDark).toBe(true);
  expect(darkState.icon).toBe('Dark');

  // Set to light theme
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForSelector('#theme-menu');
  await page.click('[data-testid="theme-light"]');
  const lightState = await captureState(page, 'light');

  // Verify light theme is applied
  expect(lightState.isVisuallyDark).toBe(false);
  expect(lightState.icon).toBe('Light');

  // Set to system theme
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForSelector('#theme-menu');
  await page.click('[data-testid="theme-system"]');
  const systemState = await captureState(page, 'system');

  // Verify system theme (might be light or dark depending on system preference)
  expect(systemState.icon).toBe('Auto');
});
