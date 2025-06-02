import Link from 'next/link';
import { Typography, Button, Paper, Container, Box } from '@mui/material';
import { ReportProblemOutlined } from '@mui/icons-material';

export default function DashboardNotFound() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={1}
        sx={{
          p: { xs: 4, sm: 6 },
          borderRadius: 2,
          textAlign: 'center',
          my: 4,
          mx: 'auto',
          bgcolor: 'var(--mui-palette-background-paper, (theme) => theme.palette.background.paper)',
          color: 'var(--mui-palette-text-primary, (theme) => theme.palette.text.primary)',
        }}
        className="theme-aware-paper"
      >
        <ReportProblemOutlined
          sx={{
            fontSize: 80,
            color: 'text.secondary',
            mb: 3,
          }}
        />

        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'medium' }}>
          Dashboard Page Not Found
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
          The dashboard page you requested doesn't exist or has been moved.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button component={Link} href="/dashboard" variant="contained" size="large">
            Back to Dashboard
          </Button>
          <Button component={Link} href="/" variant="outlined" size="large">
            Return to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
