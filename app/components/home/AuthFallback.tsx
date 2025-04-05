'use client';

import Box from '@mui/material/Box';

export default function AuthFallback() {
  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'warning.main',
        borderRadius: 1,
        bgcolor: 'warning.light',
      }}
    >
      Authentication component failed to load. Please refresh the page.
    </Box>
  );
}
