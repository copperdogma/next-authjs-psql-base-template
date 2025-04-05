// This component must be a Client Component
'use client';

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { createAppTheme } from '@/lib/theme';
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
export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = React.useMemo(() => {
    return createAppTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
  }, [resolvedTheme]);

  if (!mounted) {
    return null;
  }

  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
