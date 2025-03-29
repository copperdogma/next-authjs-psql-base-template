'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Helper function to determine theme based on time of day
const getTimeBasedTheme = (): 'dark' | 'light' => {
  const hours = new Date().getHours();
  // Dark theme between 8 PM and 6 AM
  return hours >= 20 || hours < 6 ? 'dark' : 'light';
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Don't do anything on the server
  useEffect(() => {
    setMounted(true);

    // Order of preference:
    // 1. User saved preference
    // 2. System preference
    // 3. Time of day
    const savedTheme = localStorage.getItem(storageKey) as Theme | null;

    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check if system preference is available
      if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('system'); // Use system which is dark
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          setTheme('system'); // Use system which is light
        } else {
          // If no system preference, use time-based theme
          setTheme(getTimeBasedTheme());
        }
      } else {
        // If no matchMedia support, fall back to time-based theme
        setTheme(getTimeBasedTheme());
      }
    }

    // Watch for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        // Force a re-render when system preference changes
        document.documentElement.setAttribute('data-mode', mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [defaultTheme, storageKey, theme]);

  // Set the theme attribute only on the client side to avoid hydration issues
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;

    // Remove the data-mode attribute if it exists
    root.removeAttribute('data-mode');

    if (theme === 'system') {
      // System preference - check if available
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.setAttribute('data-mode', 'dark');
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        root.setAttribute('data-mode', 'light');
      } else {
        // Fall back to time-based if no system preference
        root.setAttribute('data-mode', getTimeBasedTheme());
      }
    } else {
      // User explicitly set theme
      root.setAttribute('data-mode', theme);
    }
  }, [theme, mounted]);

  // Only expose theme controls if mounted to avoid hydration issues
  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (mounted) {
        localStorage.setItem(storageKey, theme);
        setTheme(theme);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
