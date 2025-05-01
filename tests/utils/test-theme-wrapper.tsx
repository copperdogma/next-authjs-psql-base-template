import React, { ReactNode, createContext } from 'react';

// Define the theme context shape that mimics next-themes
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  themes: Theme[];
  systemTheme: ResolvedTheme;
};

// Create a default theme context value for tests
const defaultThemeContextValue: ThemeContextValue = {
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
  themes: ['light', 'dark', 'system'],
  systemTheme: 'light',
};

// Create a mock theme context
export const MockThemeContext = createContext<ThemeContextValue>(defaultThemeContextValue);

// Mock useTheme hook
export const useTheme = jest.fn(() => defaultThemeContextValue);

// Theme wrapper component for tests
export function ThemeWrapper({
  children,
  themeValue = defaultThemeContextValue,
}: {
  children: ReactNode;
  themeValue?: ThemeContextValue;
}) {
  // Use the provided theme value or default
  const contextValue = themeValue || defaultThemeContextValue;

  return <MockThemeContext.Provider value={contextValue}>{children}</MockThemeContext.Provider>;
}

// Helper to render with a specific theme
export function renderWithTheme(
  ui: React.ReactElement,
  themeState?: {
    theme: Theme;
    resolvedTheme?: ResolvedTheme;
  }
) {
  const setThemeMock = jest.fn();
  const resolvedTheme =
    themeState?.resolvedTheme ||
    (themeState?.theme === 'system' ? 'light' : themeState?.theme) ||
    'light';

  const themeValue: ThemeContextValue = {
    theme: themeState?.theme || 'system',
    setTheme: setThemeMock,
    resolvedTheme,
    themes: ['light', 'dark', 'system'],
    systemTheme: 'light',
  };

  return {
    ui: <ThemeWrapper themeValue={themeValue}>{ui}</ThemeWrapper>,
    setThemeMock,
  };
}
