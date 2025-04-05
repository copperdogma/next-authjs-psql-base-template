'use client';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Paper } from '@mui/material';

interface FeatureCardProps {
  title: string;
  description: string;
}

export default function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
      <Paper
        elevation={1}
        sx={{
          p: { xs: 3, sm: 4 },
          height: '100%',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Paper>
    </Box>
  );
}
