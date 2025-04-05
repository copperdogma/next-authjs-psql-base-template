'use client';

import Link from 'next/link';
import { Box, Container, Typography, Button, useTheme } from '@mui/material';

export default function ApplicationFooter() {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        backgroundColor:
          theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[900],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} {'{{YOUR_COMPANY_NAME}}'} All rights reserved.
        </Typography>
        <Box
          component="nav"
          aria-label="Footer Navigation"
          data-testid="footer-navigation"
          sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}
        >
          <Button component={Link} href="/privacy" color="inherit" size="small">
            Privacy
          </Button>
          <Button component={Link} href="/terms" color="inherit" size="small">
            Terms
          </Button>
          <Button component={Link} href="/contact" color="inherit" size="small">
            Contact
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
