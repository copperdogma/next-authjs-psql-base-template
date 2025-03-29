// This component must be a Client Component
'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme as baseTheme } from '@/lib/theme';
import { ReactNode, useMemo, useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

// This implementation is from the Material UI with Next.js example
// https://github.com/mui/material-ui/tree/master/examples/material-ui-nextjs
export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const { theme: mode } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Create the MUI theme based on our dark/light mode
  const muiTheme = useMemo(() => {
    const isDark =
      mounted &&
      (mode === 'dark' ||
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));

    // Create a theme instance with the appropriate mode
    return createTheme({
      ...baseTheme,
      palette: {
        mode: isDark ? 'dark' : 'light',
        ...(isDark
          ? {
              // Dark mode customizations
              background: {
                default: '#121212',
                paper: '#1e1e1e',
              },
            }
          : {}),
        ...baseTheme.palette,
      },
    });
  }, [mode, mounted]);

  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
