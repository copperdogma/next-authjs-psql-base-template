'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode, BrightnessAuto } from '@mui/icons-material';

type ThemeType = 'light' | 'dark' | 'system';

/**
 * ThemeToggle component that cycles between light, dark and system theme modes
 * Icons display the CURRENT mode, tooltips indicate what happens on click
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Set mounted state on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Define the cycle order
  const themeMap: Record<ThemeType, { next: ThemeType; icon: React.ReactNode; tooltip: string }> = {
    light: {
      next: 'dark',
      icon: <LightMode data-testid="LightModeIcon" />,
      tooltip: 'Switch to dark mode',
    },
    dark: {
      next: 'system',
      icon: <DarkMode data-testid="DarkModeIcon" />,
      tooltip: 'Switch to system mode',
    },
    system: {
      next: 'light',
      icon: <BrightnessAuto data-testid="BrightnessAutoIcon" />,
      tooltip: 'Switch to light mode',
    },
  };

  // Default to system if theme is not a valid option
  const currentTheme = (theme as string) in themeMap ? (theme as ThemeType) : 'system';
  const { next, icon, tooltip } = themeMap[currentTheme];

  return (
    <Tooltip title={tooltip} placement="bottom" arrow enterDelay={300} leaveDelay={100}>
      <IconButton
        onClick={() => setTheme(next)}
        color="inherit"
        aria-label={`Current theme: ${currentTheme}. ${tooltip}`}
        edge="end"
        data-testid="theme-toggle"
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
}
