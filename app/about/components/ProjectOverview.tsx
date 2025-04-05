'use client';

import { Paper, Typography } from '@mui/material';

/**
 * Project Overview section of the About page
 */
export default function ProjectOverview() {
  return (
    <Paper
      elevation={1}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Project Overview
      </Typography>
      <Typography variant="body1" paragraph>
        This is a starter template designed to help developers quickly bootstrap new projects with a
        modern tech stack. It provides essential features and best practices out of the box,
        allowing you to focus on building your application rather than setting up infrastructure.
      </Typography>
      <Typography variant="body1" paragraph>
        Feel free to modify or remove this page as needed for your project.
      </Typography>
    </Paper>
  );
}
