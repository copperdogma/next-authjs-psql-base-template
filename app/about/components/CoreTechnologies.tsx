'use client';

import { Paper, Typography, Divider, List, ListItem, ListItemText, Box } from '@mui/material';

/**
 * Core Technologies section of the About page
 */
export default function CoreTechnologies() {
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
          Core Technologies
        </Typography>
        <Divider sx={{ my: 2 }} />
        <List disablePadding>
          <ListItem disableGutters>
            <ListItemText
              primary="Next.js 15+"
              secondary="React framework with App Router, Server Components, and optimized performance"
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="React 19"
              secondary="Latest React with improved performance and hooks"
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="TypeScript"
              secondary="Type-safe development experience with full type checking"
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText
              primary="Material UI"
              secondary="Comprehensive component library with customizable theming"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}
