// This component must be a Client Component
'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme as baseTheme } from '@/lib/theme';
import { ReactNode, useMemo, useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import './mui-overrides.css';

// This helper resolves color channels for MUI
const applyColorChannels = (theme: any) => {
  // Only apply if cssVariables is enabled
  return {
    ...theme,
    colorSchemes: {
      light: {
        palette: {
          ...theme.palette,
          primary: {
            ...theme.palette.primary,
            mainChannel: '14 165 233', // RGB for 0ea5e9 (primary.500)
          },
          secondary: {
            ...theme.palette.secondary,
            mainChannel: '156 39 176', // RGB for 9c27b0
          },
          background: {
            ...theme.palette.background,
            defaultChannel: '255 255 255', // RGB for white
            paperChannel: '255 255 255', // RGB for white
          }
        },
      },
      dark: {
        palette: {
          ...theme.palette,
          background: {
            ...theme.palette.background,
            defaultChannel: '3 7 18', // RGB for #030712
            paperChannel: '3 7 18', // RGB for #030712
          }
        },
      },
    }
  };
};

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
    const themeOptions = {
      ...baseTheme,
      // Enable CSS variables for better theme customization and dark mode
      cssVariables: true,
      palette: {
        mode: mounted && (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) 
          ? 'dark' 
          : 'light',
        ...baseTheme.palette,
      },
    };
    
    // Apply the theme with color channels fixed
    const enhancedTheme = applyColorChannels(themeOptions);
    return createTheme(enhancedTheme);
  }, [mode, mounted]);

  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </AppRouterCacheProvider>
  );
} 