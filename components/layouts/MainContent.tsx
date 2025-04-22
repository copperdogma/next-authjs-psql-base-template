'use client';

import { Box } from '@mui/material';

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <Box
      component="main"
      id="main-content"
      aria-label="Main content"
      tabIndex={-1}
      sx={{
        flex: 1,
        outline: 'none', // Remove focus outline when skipped to
        p: { xs: 2, sm: 3 }, // Add responsive padding for better spacing
        display: 'flex',
        flexDirection: 'column',
        // alignItems: 'center', // Removed to allow content to stretch
        // justifyContent: 'center', // Removed to allow content to flow from top
      }}
    >
      {children}
    </Box>
  );
}
