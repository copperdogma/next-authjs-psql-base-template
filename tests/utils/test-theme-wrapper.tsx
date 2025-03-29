import React, { ReactNode } from 'react';

// Mock theme context values
const defaultThemeContextValue = {
  theme: 'system',
  setTheme: jest.fn(),
  resolvedTheme: 'light',
};

// Create a mock context
export const MockThemeContext = React.createContext(defaultThemeContextValue);

// Mock useTheme hook
export const useTheme = jest.fn(() => defaultThemeContextValue);

// Theme wrapper component for tests
export function ThemeWrapper({
  children,
  themeValue = defaultThemeContextValue,
}: {
  children: ReactNode;
  themeValue?: typeof defaultThemeContextValue;
}) {
  // Use the provided theme value or default
  const contextValue = themeValue || defaultThemeContextValue;

  return <MockThemeContext.Provider value={contextValue}>{children}</MockThemeContext.Provider>;
}

// Helper to render with a specific theme
export function renderWithTheme(
  ui: React.ReactElement,
  themeState?: {
    theme: 'light' | 'dark' | 'system';
    resolvedTheme?: 'light' | 'dark';
  }
) {
  const setThemeMock = jest.fn();
  const resolvedTheme =
    themeState?.resolvedTheme ||
    (themeState?.theme === 'system' ? 'light' : themeState?.theme) ||
    'light';

  const themeValue = {
    theme: themeState?.theme || 'system',
    setTheme: setThemeMock,
    resolvedTheme,
  };

  return {
    ui: <ThemeWrapper themeValue={themeValue}>{ui}</ThemeWrapper>,
    setThemeMock,
  };
}
