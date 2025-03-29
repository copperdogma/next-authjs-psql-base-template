import Link from 'next/link';
import PageLayout from '@/components/layouts/PageLayout';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

export default function NotFound() {
  return (
    <PageLayout title="404" subtitle="Page Not Found">
      <Paper
        elevation={1}
        sx={{
          p: { xs: 4, sm: 6 },
          borderRadius: 2,
          textAlign: 'center',
          my: 4,
          maxWidth: 600,
          mx: 'auto',
        }}
      >
        <ErrorOutline
          sx={{
            fontSize: 80,
            color: 'text.secondary',
            mb: 3,
          }}
        />

        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'medium' }}>
          Page Not Found
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{
            maxWidth: 450,
            mx: 'auto',
            mb: 4,
          }}
        >
          The page you are looking for doesn't exist or has been moved.
        </Typography>

        <Button component={Link} href="/" variant="contained" size="large">
          Return to Home
        </Button>
      </Paper>
    </PageLayout>
  );
}
