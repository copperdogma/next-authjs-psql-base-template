import { Grid, Paper, Skeleton, Container, Typography } from '@mui/material';

export default function DashboardLoading() {
  return (
    // Using Container for consistency with potential dashboard layout
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Skeleton for a page title or header */}
      <Typography variant="h4" gutterBottom>
        <Skeleton width="30%" />
      </Typography>

      {/* Simplified Grid for testing linter */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3].map(key => (
          // Applying the pattern found in app/dashboard/page.tsx
          <Grid
            key={key}
            size={{
              xs: 12,
              sm: 6, // Adjusted from 4 to 6 to match previous sm attempts if that was intended
              md: 4,
            }}
          >
            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
              <Skeleton variant="text" width="60%" height={30} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="80%" />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Skeleton for another section, perhaps a larger card or chart area */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={100} />
      </Paper>
    </Container>
  );
}
