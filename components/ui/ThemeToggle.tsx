'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode, BrightnessAuto } from '@mui/icons-material';

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

  return (
    <Tooltip title={`Theme: ${theme === 'system' ? 'Auto' : theme}`}>
      <IconButton
        onClick={() => {
          if (theme === 'light') setTheme('dark');
          else if (theme === 'dark') setTheme('system');
          else setTheme('light');
        }}
        color="inherit"
        aria-label="Toggle theme"
        edge="end"
      >
        {theme === 'dark' ? <DarkMode /> : theme === 'light' ? <LightMode /> : <BrightnessAuto />}
      </IconButton>
    </Tooltip>
  );
}
