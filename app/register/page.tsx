import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import RegistrationForm from './components/RegistrationForm';

export default function RegisterPage() {
  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <Box sx={{ mt: 1, width: '100%' }}>
          <RegistrationForm />
        </Box>
      </Paper>
    </Container>
  );
}
