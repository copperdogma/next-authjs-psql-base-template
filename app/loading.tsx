import { CircularProgress, Box, Typography } from '@mui/material';

export default function GlobalLoading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        p: 3,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
        Loading...
      </Typography>
    </Box>
  );
}
