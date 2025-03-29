'use client';

import { Box, Link } from '@mui/material';
import { useState, useEffect } from 'react';

/**
 * Skip to content component for improved accessibility
 *
 * This component renders a link that's visually hidden until focused,
 * allowing keyboard users to bypass navigation and jump straight to
 * the main content of the page.
 */
export function SkipToContent() {
  // Track whether the component has mounted to avoid hydration issues
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR to avoid hydration mismatches
  if (!mounted) {
    return null;
  }

  return (
    <Box
      component="div"
      sx={{
        position: 'absolute',
        top: -9999,
        left: -9999,
        zIndex: 9999,
        '&:focus-within': {
          top: 16,
          left: 16,
        },
      }}
    >
      <Link
        href="#main-content"
        sx={{
          display: 'inline-block',
          px: 3,
          py: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontWeight: 'bold',
          textDecoration: 'none',
          borderRadius: 1,
          boxShadow: 2,
          '&:hover': {
            bgcolor: 'primary.dark',
          },
          '&:focus': {
            outline: '2px solid',
            outlineColor: 'primary.dark',
            outlineOffset: 2,
          },
        }}
      >
        Skip to content
      </Link>
    </Box>
  );
}
