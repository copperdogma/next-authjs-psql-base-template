'use client';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Paper, Stack, Divider, List, ListItem, ListItemText } from '@mui/material';
import PageLayout from '@/components/layouts/PageLayout';

export default function AboutPage() {
  return (
    <PageLayout
      title="About This Template"
      subtitle="Next.js, Firebase Authentication, and PostgreSQL Starter Template"
    >
      <Stack spacing={4}>
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
            This is a starter template designed to help developers quickly bootstrap new projects
            with a modern tech stack. It provides essential features and best practices out of the
            box, allowing you to focus on building your application rather than setting up
            infrastructure.
          </Typography>
          <Typography variant="body1" paragraph>
            Feel free to modify or remove this page as needed for your project.
          </Typography>
        </Paper>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
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
        </Box>

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
      </Stack>
    </PageLayout>
  );
}
