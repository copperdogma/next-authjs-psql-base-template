'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { User } from 'next-auth';
import SignOutButton from './SignOutButton';
import { updateUserName } from '@/app/profile/actions';
import { useSession } from 'next-auth/react';
import NameEditSection from './NameEditSection';
import ProfileField from './ProfileField';

interface ProfileDetailsSectionProps {
  user: User;
}

export default function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const { data: session, update: updateSession } = useSession();
  const [newName, setNewName] = useState<string | null>(null);

  const [state, formAction] = useActionState(updateUserName, {
    message: '',
    success: false,
  });

  const hasUpdatedSessionRef = useRef(false);

  const handleFormSubmit = async (formData: FormData) => {
    const nameValue = formData.get('name') as string;
    if (nameValue) {
      setNewName(nameValue);
      hasUpdatedSessionRef.current = false;
    }
    return formAction(formData);
  };

  useEffect(() => {
    if (state.success && !hasUpdatedSessionRef.current && newName && session) {
      setIsEditingName(false);
      hasUpdatedSessionRef.current = true;

      updateSession({
        ...session,
        user: {
          ...session.user,
          name: newName,
        },
      });

      setNewName(null);
    } else if (!state.success) {
      hasUpdatedSessionRef.current = false;
    }
  }, [state.success, updateSession, session, newName]);

  return (
    <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 calc(100% - 250px - 48px)' } }}>
      <Stack spacing={4}>
        <NameEditSection
          user={user}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          formAction={handleFormSubmit}
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
