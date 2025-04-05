'use client';

import { Paper, Typography, Divider, List, ListItem, ListItemText, Box } from '@mui/material';

/**
 * Key Features section of the About page
 */
export default function KeyFeatures() {
  return (
    <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
      <Paper
        elevation={1}
        sx={{
          p: { xs: 3, sm: 4 },
          height: '100%',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" component="h3" gutterBottom>
          Key Features
        </Typography>
        <Divider sx={{ my: 2 }} />
        <List disablePadding>
          <ListItem disableGutters>
            <ListItemText
              primary="Authentication"
              secondary="Firebase Authentication integration with Google sign-in"
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Database"
              secondary="PostgreSQL with Prisma ORM for type-safe database access"
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Theme Management"
              secondary="Dark/light mode with system preference detection"
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Testing"
              secondary="Comprehensive testing setup with Jest and Playwright"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}
