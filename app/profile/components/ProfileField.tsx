'use client';

import { Box, Typography } from '@mui/material';

interface ProfileFieldProps {
  label: string;
  value: string | null | undefined;
}

export default function ProfileField({ label, value }: ProfileFieldProps) {
  // Convert undefined to null to satisfy TypeScript
  const displayValue = value === undefined ? null : value;

  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography id={`profile-field-${label.toLowerCase()}-value`} variant="h6" sx={{ mt: 1 }}>
        {displayValue || 'Not provided'}
      </Typography>
    </Box>
  );
}
