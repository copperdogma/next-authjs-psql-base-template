'use client';

import { Alert } from '@mui/material';

interface FormErrorAlertProps {
  error: string;
}

export default function FormErrorAlert({ error }: FormErrorAlertProps) {
  if (!error) return null;

  return (
    <Alert severity="error" sx={{ mt: 2 }}>
      {error}
    </Alert>
  );
}
