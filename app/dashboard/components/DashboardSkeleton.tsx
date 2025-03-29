'use client';

import { Box, Paper, Skeleton, Stack } from '@mui/material';

export default function DashboardSkeleton() {
  return (
    <Stack spacing={4}>
      {/* Overview Section Skeleton */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
        }}
      >
        <Skeleton variant="text" width={150} height={32} sx={{ mb: 3 }} />

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
              <Skeleton variant="text" width={80} height={24} />
              <Skeleton variant="text" width={60} height={40} sx={{ mt: 1 }} />
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
              <Skeleton variant="text" width={80} height={24} />
              <Skeleton variant="text" width={60} height={40} sx={{ mt: 1 }} />
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
              <Skeleton variant="text" width={80} height={24} />
              <Skeleton variant="text" width={60} height={40} sx={{ mt: 1 }} />
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
              <Skeleton variant="text" width={80} height={24} />
              <Skeleton variant="text" width={60} height={40} sx={{ mt: 1 }} />
            </Paper>
          </Box>
        </Box>
      </Paper>

      {/* Dashboard Cards Skeleton */}
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
            <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="70%" />
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
            <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="70%" />
          </Paper>
        </Box>
      </Box>

      {/* Recent Activity Skeleton */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
        }}
      >
        <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="85%" />
      </Paper>
    </Stack>
  );
}
