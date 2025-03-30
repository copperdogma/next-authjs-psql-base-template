// This component must be a Client Component
'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from '@/lib/theme';
import { ReactNode, useMemo } from 'react';
import { useTheme } from './ThemeProvider';

/**
 * ThemeRegistry component that provides Material UI theming support
 *
 * This component:
 * 1. Creates a cache for MUI styles using AppRouterCacheProvider
 * 2. Uses our custom theme provider to get the current theme
 * 3. Applies the appropriate pre-generated theme (light/dark)
 * 4. Sets up CSS baseline for consistent styling
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

  // Use the pre-created theme directly based on resolved theme
  const muiTheme = useMemo(() => {
    return resolvedTheme === 'dark' ? darkTheme : lightTheme;
  }, [resolvedTheme]);

  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
