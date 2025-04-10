'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { User } from 'next-auth';
import SignOutButton from './SignOutButton';
import { useFormState } from 'react-dom';
import { updateUserName } from '@/app/profile/actions';
import { useSession } from 'next-auth/react';
import NameEditSection from './NameEditSection';
import ProfileField from './ProfileField';

interface ProfileDetailsSectionProps {
  user: User;
}

export default function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const { update: updateSession } = useSession();
  const [state, formAction] = useFormState(updateUserName, {
    message: '',
    success: false,
  });

  const hasUpdatedSessionRef = useRef(false);

  useEffect(() => {
    if (state.success && !hasUpdatedSessionRef.current) {
      setIsEditingName(false);
      hasUpdatedSessionRef.current = true;
      updateSession({ force: true });
    } else if (!state.success) {
      hasUpdatedSessionRef.current = false;
    }
  }, [state.success, updateSession]);

  return (
    <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 calc(100% - 250px - 48px)' } }}>
      <Stack spacing={4}>
        <NameEditSection
          user={user}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          formAction={formAction}
          state={state}
        />
        <Divider />
        <ProfileField label="Email" value={user.email} />
        <Divider />
        <ProfileField label="User ID" value={user.id} />
        <Divider />
        <SignOutButton />
      </Stack>
    </Box>
  );
}
