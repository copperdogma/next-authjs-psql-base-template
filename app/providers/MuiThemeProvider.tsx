'use client';

import { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useTheme } from '@/app/providers/ThemeProvider';

interface MuiThemeProviderProps {
  children: ReactNode;
}

export default function MuiThemeProvider({ children }: MuiThemeProviderProps) {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(lightTheme);
  const [mounted, setMounted] = useState(false);

  // Only update the theme on the client side to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Get the current mode from the data-mode attribute
    const dataMode = document.documentElement.getAttribute('data-mode');

    if (dataMode === 'dark') {
      setCurrentTheme(darkTheme);
    } else {
      setCurrentTheme(lightTheme);
    }
  }, [theme, mounted]);

  // During SSR, don't apply the theme to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return <ThemeProvider theme={currentTheme}>{children}</ThemeProvider>;
}
