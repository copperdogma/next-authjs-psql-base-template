'use client';

import { Paper, Typography } from '@mui/material';

/**
 * Getting Started section of the About page
 */
export default function GettingStarted() {
  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Getting Started
      </Typography>
      <Typography variant="body1" paragraph>
        To customize this template for your project:
      </Typography>
      <Typography variant="body1" component="ol" sx={{ pl: 3 }}>
        <li>Update environment variables with your API keys and database connection string</li>
        <li>Modify the branding and UI to match your project requirements</li>
        <li>Extend the database schema with your application models</li>
        <li>Add your application-specific pages and components</li>
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Refer to the README file and documentation for detailed setup instructions.
      </Typography>
    </Paper>
  );
}
