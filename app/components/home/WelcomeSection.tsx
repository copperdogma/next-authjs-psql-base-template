'use client';

import Typography from '@mui/material/Typography';
import { Paper } from '@mui/material';
import AuthButtons from './AuthButtons';

export default function WelcomeSection() {
  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 2 }}>
        Get Started
      </Typography>
      <Typography variant="body1" paragraph sx={{ maxWidth: 700, mx: 'auto' }}>
        This template provides a solid foundation for your next web application, including
        authentication, database integration, and a clean UI built with Material UI.
      </Typography>
      <AuthButtons />
    </Paper>
  );
}
