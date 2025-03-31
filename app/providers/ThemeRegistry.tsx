// This component must be a Client Component
'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@/lib/theme';
import { ReactNode, useEffect, useState, useMemo } from 'react';
import { useTheme } from 'next-themes';

/**
 * ThemeRegistry component that provides Material UI theming support
 *
 * This component:
 * 1. Creates a cache for MUI styles using AppRouterCacheProvider
 * 2. Uses next-themes to get the current theme
 * 3. Applies the appropriate pre-generated theme (light/dark)
 * 4. Sets up CSS baseline for consistent styling
 * 5. Prevents theme flashing during navigation
 *
 * Based on the Material UI with Next.js App Router setup:
 * https://github.com/mui/material-ui/tree/master/examples/material-ui-nextjs
 *
 * @param {Object} props - Component properties
 * @param {ReactNode} props.children - Child components that will use the Material UI theme
 * @returns {JSX.Element} Themed application with Material UI support
 */
export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Force initial mount of MUI with the correct theme
  const initialTheme = useMemo(() => {
    return typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
        ? 'dark'
        : 'light'
      : 'light';
  }, []);

  // Monitor mounting state to prevent hydration issues
  useEffect(() => {
    setMounted(true);
    const handleBeforeNavigate = () => {
      document.documentElement.classList.add('disable-transitions');
    };

    // Add event listener for beforeunload
    window.addEventListener('beforeunload', handleBeforeNavigate);

    // Clean up function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeNavigate);
    };
  }, []);

  // Use the pre-created theme directly based on resolved theme
  const muiTheme = useMemo(() => {
    if (!mounted) {
      // Use the initialTheme we detected to avoid hydration mismatches
      return initialTheme === 'dark' ? darkTheme : lightTheme;
    }

    // After mounting, use the resolved theme from next-themes
    return resolvedTheme === 'dark' ? darkTheme : lightTheme;
  }, [resolvedTheme, mounted, initialTheme]);

  // Debugging in development only
  if (process.env.NODE_ENV === 'development' && mounted) {
    console.log('ThemeRegistry:', {
      resolvedTheme,
      initialTheme,
      usingDarkTheme: resolvedTheme === 'dark',
      muiThemePaletteMode: muiTheme.palette.mode,
    });
  }

  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
