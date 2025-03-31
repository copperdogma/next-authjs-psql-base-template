'use client';

import { useSession } from 'next-auth/react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import React from 'react';

export default function DashboardContent() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  return (
    <Stack spacing={4}>
      {/* Overview Section */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 3 }}>
          Overview
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: 'action.hover',
                borderRadius: 2,
                height: '100%',
              }}
            >
              <Typography variant="subtitle1" component="h3" fontWeight="medium">
                Metric 1
              </Typography>
              <Typography variant="h4" component="p" fontWeight="bold" sx={{ mt: 1 }}>
                3,721
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: 'action.hover',
                borderRadius: 2,
                height: '100%',
              }}
            >
              <Typography variant="subtitle1" component="h3" fontWeight="medium">
                Metric 2
              </Typography>
              <Typography variant="h4" component="p" fontWeight="bold" sx={{ mt: 1 }}>
                2,519
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: 'action.hover',
                borderRadius: 2,
                height: '100%',
              }}
            >
              <Typography variant="subtitle1" component="h3" fontWeight="medium">
                Metric 3
              </Typography>
              <Typography variant="h4" component="p" fontWeight="bold" sx={{ mt: 1 }}>
                1,489
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 18px)' } }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: 'action.hover',
                borderRadius: 2,
                height: '100%',
              }}
            >
              <Typography variant="subtitle1" component="h3" fontWeight="medium">
                Metric 4
              </Typography>
              <Typography variant="h4" component="p" fontWeight="bold" sx={{ mt: 1 }}>
                968
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Paper>

      {/* Dashboard Cards */}
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
            <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 2 }}>
              Welcome
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Hello, {user.name || user.email || 'User'}! This is your dashboard placeholder.
            </Typography>
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
            <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 2 }}>
              Statistics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your important metrics and data will appear here.
            </Typography>
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
        <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 2 }}>
          Recent Activity
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your recent actions and activity will be displayed in this section.
        </Typography>
      </Paper>
    </Stack>
  );
}
