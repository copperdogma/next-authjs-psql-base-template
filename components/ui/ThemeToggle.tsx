'use client';

import React, { useEffect, useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode, BrightnessAuto } from '@mui/icons-material';
import { useTheme } from 'next-themes';
import ThemeMenu from './theme/ThemeMenu';

/**
 * Renders the appropriate theme icon based on current theme setting
 */
function ThemeIcon({
  theme,
  resolvedTheme,
}: {
  theme: string | undefined;
  resolvedTheme: string | undefined;
}) {
  // First check if theme is set to system/auto
  if (theme === 'system') {
    return <BrightnessAuto fontSize="small" data-testid="BrightnessAutoIcon" />;
  }

  // Otherwise use the resolved theme for the icon (what's actually showing)
  return resolvedTheme === 'dark' ? (
    <DarkMode fontSize="small" data-testid="DarkModeIcon" />
  ) : (
    <LightMode fontSize="small" data-testid="LightModeIcon" />
  );
}

/**
 * ThemeToggle component that provides a user interface for switching themes
 *
 * This component:
 * 1. Displays the current theme state (dark/light/auto)
 * 2. Provides a dropdown menu to switch between themes
 * 3. Shows visual indication of the current theme
 * 4. Properly handles theme transitions to prevent flashing
 * 5. Handles hydration properly with mounted state check
 *
 * @returns {JSX.Element} Theme toggle button with dropdown menu
 */
export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const open = Boolean(anchorEl);

  // Only show theme toggle UI after mounting on client to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    handleClose();
  };

  // Don't render during SSR to prevent hydration mismatch
  if (!mounted) return null;

  return (
    <>
      <Tooltip title={`Theme: ${theme === 'system' ? 'Auto' : theme}`}>
        <IconButton
          onClick={handleClick}
          color="inherit"
          aria-controls={open ? 'theme-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          data-testid="theme-toggle"
        >
          <ThemeIcon theme={theme} resolvedTheme={resolvedTheme} />
        </IconButton>
      </Tooltip>

      <ThemeMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
      />
    </>
  );
}
