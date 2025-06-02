'use client';

import { Box, Button, Typography, Container } from '@mui/material';

export default function Offline() {
  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          You are offline
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Please check your internet connection and try again.
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ px: 3, py: 1 }}>
          Try Again
        </Button>
      </Box>
    </Container>
  );
}
