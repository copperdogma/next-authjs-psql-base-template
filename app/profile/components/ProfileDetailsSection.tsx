'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Divider, Stack, Button, TextField } from '@mui/material';
import { User } from 'next-auth';
import SignOutButton from './SignOutButton';
import { useFormState } from 'react-dom';
import { updateUserName } from '@/app/profile/actions';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

interface ProfileDetailsSectionProps {
  user: User;
}

export default function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [state, formAction] = useFormState(updateUserName, {
    message: '',
    success: false,
  });

  // Reset edit mode when form submission is successful
  useEffect(() => {
    if (state.success) {
      setIsEditingName(false);
    }
  }, [state.success]);

  return (
    <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 calc(100% - 250px - 48px)' } }}>
      <Stack spacing={4}>
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Display Name
            {!isEditingName && (
              <Button
                startIcon={<EditIcon />}
                size="small"
                onClick={() => setIsEditingName(true)}
                sx={{ ml: 2 }}
              >
                Edit
              </Button>
            )}
          </Typography>

          {isEditingName ? (
            <form action={formAction}>
              <Box sx={{ mt: 1 }}>
                <TextField
                  name="name"
                  defaultValue={user.name || ''}
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Enter your name"
                  autoFocus
                />
                {state.message && (
                  <Typography
                    variant="caption"
                    color={state.success ? 'success.main' : 'error.main'}
                    sx={{ display: 'block', mt: 1 }}
                  >
                    {state.message}
                  </Typography>
                )}
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button type="submit" variant="contained" size="small" startIcon={<SaveIcon />}>
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setIsEditingName(false);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </form>
          ) : (
            <Typography variant="h6" sx={{ mt: 1 }}>
              {user.name || 'Not provided'}
            </Typography>
          )}
        </Box>

        <Divider />

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 500 }}>
            Email
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {user.email || 'Not provided'}
          </Typography>
        </Box>

        <Divider />

        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 500 }}>
            User ID
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {user.id || 'Not available'}
          </Typography>
        </Box>

        <Divider />

        <SignOutButton />
      </Stack>
    </Box>
  );
}
