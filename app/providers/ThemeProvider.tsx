'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'system';

/**
 * Properties for the ThemeProvider component
 * 
 * @property {ReactNode} children - Child components that will have access to the theme context
 * @property {Theme} [defaultTheme='system'] - The initial theme to use, defaults to 'system'
 * @property {string} [storageKey='theme'] - The key used to store theme preference in localStorage
 */
type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

/**
 * The state maintained by the ThemeProvider context
 * 
 * @property {Theme} theme - The currently selected theme ('dark', 'light', or 'system')
 * @property {Function} setTheme - Function to update the theme
 * @property {string} resolvedTheme - The actual theme being applied ('dark' or 'light')
 */
type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
};

// Initial context state
const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'light',
};

// Create the context
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Custom hook to access the theme context
 * 
 * @returns {ThemeProviderState} The current theme context state
 * @throws {Error} If used outside of a ThemeProvider
 */
export function useTheme(): ThemeProviderState {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
}

/**
 * ThemeProvider component that manages theme state and provides it via context
 * 
 * Features:
 * - Persists theme preference in localStorage
 * - Supports system preference via media queries
 * - Handles server/client rendering gracefully
 * - Provides resolved theme for direct usage
 * 
 * @param {ThemeProviderProps} props - Component properties
 * @returns {JSX.Element} Provider component with theme context
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light');
  const [mounted, setMounted] = useState(false);

  // Don't do anything on the server
  useEffect(() => {
    setMounted(true);

    // Get saved theme from localStorage on client side
    const savedTheme = localStorage.getItem(storageKey) as Theme | null;
    const isFirstLoad = localStorage.getItem('first-theme-load') === null;

    if (isFirstLoad) {
      // On first load, we want to use system by default
      localStorage.setItem('first-theme-load', 'false');
      localStorage.removeItem(storageKey); // Clear any existing theme
      setTheme('system');
    } else if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Use system theme
      setTheme('system');
    }
  }, [storageKey]);

  // Update the resolved theme and data-mode when theme changes
  useEffect(() => {
    if (!mounted) return;

    // Helper function to determine the actual theme to use
    const resolveTheme = (): 'dark' | 'light' => {
      if (theme === 'system') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        } else if (
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: light)').matches
        ) {
          return 'light';
        } else {
          return getTimeBasedTheme();
        }
      }
      return theme as 'dark' | 'light';
    };

    // Apply theme to data-mode attribute and update resolved theme state
    const newResolvedTheme = resolveTheme();
    setResolvedTheme(newResolvedTheme);
    document.documentElement.setAttribute('data-mode', newResolvedTheme);

    // Add listener for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
        document.documentElement.setAttribute('data-mode', systemTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, mounted]);

  // Expose both the theme setting and the resolved theme
  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      if (mounted) {
        localStorage.setItem(storageKey, theme);
        setTheme(theme);
      }
    },
  };

  // Avoid hydration mismatch by not rendering anything on the server
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * Utility function to get a time-based theme
 * Returns 'dark' during evening/night hours (7PM-7AM) and 'light' during day
 * 
 * @returns {'light' | 'dark'} The theme based on current time
 */
function getTimeBasedTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7 ? 'dark' : 'light';
}
