'use client';

import Box from '@mui/material/Box';
import { BoxProps } from '@mui/material/Box';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';

/**
 * A Box component that is aware of theme changes and ensures proper styling during navigation
 *
 * This component extends the standard MUI Box with additional theme awareness,
 * particularly solving issues with background color persistence during navigation.
 */
export default function ThemeAwareBox({ children, sx, ...props }: BoxProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only enable transitions after component is mounted to prevent flash
  useEffect(() => {
    setMounted(true);

    // Reset any persistent styles when component mounts
    const resetStyles = () => {
      const boxEl = document.getElementById(props.id || '');
      if (boxEl) {
        boxEl.style.transition = 'none';
        boxEl.style.backgroundColor = 'transparent';

        // Re-enable transitions after a brief delay
        setTimeout(() => {
          boxEl.style.transition = '';
        }, 10);
      }
    };

    resetStyles();

    // Clean up function
    return () => {
      // Additional cleanup if needed
    };
  }, [props.id]);

  // Enhanced styles with theme awareness
  const enhancedSx = {
    // Ensure background is properly set based on context
    backgroundColor: 'transparent !important',
    // Allow all other styles to be applied
    ...sx,
  };

  // Only render once mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Box sx={enhancedSx} {...props} style={{ backgroundColor: 'transparent' }}>
        {children}
      </Box>
    );
  }

  return (
    <Box
      sx={enhancedSx}
      data-theme={resolvedTheme}
      {...props}
      style={{ backgroundColor: 'transparent', ...(props.style || {}) }}
    >
      {children}
    </Box>
  );
}
