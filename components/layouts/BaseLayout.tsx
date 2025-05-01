'use client';

import React from 'react';
import { Container } from '@mui/material';

/**
 * Base layout component that primarily acts as a container for the main page content.
 * Header and Footer are handled by the root layout (app/layout.tsx).
 */
export default function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    // Using Container to provide consistent padding and max-width for the main content area.
    // Adjust maxWidth as needed (e.g., 'lg', 'md', 'sm', false for fluid).
    // Alternatively, if you just need a flex container without padding/max-width:
    // <Box component="div" sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
    //   {children}
    // </Box>
    <Container component="div" maxWidth="lg" sx={{ flexGrow: 1 }}>
      {children}
    </Container>
  );
}
