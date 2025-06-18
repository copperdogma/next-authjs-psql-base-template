'use client'; // Add use client directive

import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles'; // Import useTheme

const Footer: React.FC = () => {
  const theme = useTheme(); // Get theme object

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto', // Push footer to bottom
        // Apply background color using the theme object from the hook
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`, // Also use theme object here for consistency
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          {'Copyright © '}
          <Link color="inherit" href="/">
            {'{YOUR_APP_NAME}'}
          </Link>{' '}
          {new Date().getFullYear()}
          {'.'}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
