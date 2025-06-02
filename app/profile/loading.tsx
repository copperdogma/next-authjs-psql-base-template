import { Box, Container, Paper, Skeleton } from '@mui/material';

export default function ProfileLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page title skeleton */}
      <Skeleton variant="text" width="200px" height={40} sx={{ mb: 4 }} />

      <Paper
        elevation={1}
        sx={{
          p: 4,
          borderRadius: 2,
          border: 'none',
          boxShadow: 'none',
          backgroundImage: 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, md: 6 },
            alignItems: { xs: 'center', md: 'flex-start' },
          }}
        >
          {/* Profile Image Skeleton */}
          <Skeleton
            variant="circular"
            width={160}
            height={160}
            sx={{
              flexShrink: 0,
              border: '4px solid',
              borderColor: 'divider',
            }}
          />

          {/* Profile Information Skeleton */}
          <Box sx={{ flexGrow: 1, width: '100%' }}>
            <Box sx={{ mb: 3 }}>
              <Skeleton variant="text" width="80px" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="180px" height={28} />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Skeleton variant="text" width="80px" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="220px" height={28} />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Skeleton variant="text" width="80px" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100px" height={28} />
            </Box>

            <Box sx={{ pt: 2 }}>
              <Skeleton variant="rectangular" width="100px" height={36} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
