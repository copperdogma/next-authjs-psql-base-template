'use client';

import { useState, useEffect, useRef, useActionState } from 'react';
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
  const { update: updateSession } = useSession();
  const [newName, setNewName] = useState<string | null>(null);
  
  const [state, formAction] = useActionState(updateUserName, {
    message: '',
    success: false,
  });

  const hasUpdatedSessionRef = useRef(false);

  // Custom form submit handler that captures the name first
  const handleFormSubmit = async (formData: FormData) => {
    const nameValue = formData.get('name') as string;
    if (nameValue) {
      setNewName(nameValue);
    }
    return formAction(formData);
  };

  useEffect(() => {
    if (state.success && !hasUpdatedSessionRef.current && newName) {
      setIsEditingName(false);
      hasUpdatedSessionRef.current = true;
      
      // Update the session with the captured name
      updateSession({
        user: {
          ...user,
          name: newName
        }
      });
      
      // Reset the captured name after updating
      setNewName(null);
    } else if (!state.success) {
      hasUpdatedSessionRef.current = false;
    }
  }, [state.success, updateSession, user, newName]);

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
