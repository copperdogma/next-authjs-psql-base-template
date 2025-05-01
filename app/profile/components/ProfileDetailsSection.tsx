'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { User } from 'next-auth';
import SignOutButton from './SignOutButton';
import { updateUserName, UpdateUserNameFormState } from '@/app/profile/actions'; // Import type
// import { useSession } from 'next-auth/react'; // No longer needed for update
import { useUserStore } from '@/lib/store/userStore'; // Import Zustand store
import NameEditSection from './NameEditSection';
import ProfileField from './ProfileField';
import { toast } from '@/components/ui/Toaster'; // Import toast

interface ProfileDetailsSectionProps {
  user: User; // Keep initial user prop for non-name fields
}

export default function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  // const { data: session, update: updateSession } = useSession(); // Removed useSession

  // Get user details and update action from Zustand store
  const { id: userId, name: currentName, email, setUserDetails } = useUserStore();

  // Use the specific state type from the action
  const [state, formAction] = useActionState<UpdateUserNameFormState, FormData>(updateUserName, {
    message: '',
    success: false,
    updatedName: null, // Initial state for the new field
  });

  // Use ref to track if store update was attempted to prevent multiple updates
  const storeUpdateAttemptedRef = useRef(false);

  const handleFormSubmit = async (formData: FormData) => {
    storeUpdateAttemptedRef.current = false; // Reset attempt flag on new submit
    return formAction(formData);
  };

  useEffect(() => {
    // When the server action succeeds AND we haven't tried updating the store yet
    if (state.success && state.updatedName && !storeUpdateAttemptedRef.current) {
      storeUpdateAttemptedRef.current = true; // Mark update as attempted
      setIsEditingName(false);

      console.log('Profile action success, updating Zustand store with:', {
        name: state.updatedName,
      });

      // Update the Zustand store directly with the new name
      setUserDetails({ name: state.updatedName });

      // Show success toast
      if (state.message) {
        toast.success(state.message);
      }

      // Removed updateSession call
    } else if (!state.success && state.message) {
      // Show error toast only if there's an error message
      // Reset attempt flag if the action failed (e.g., validation error)
      storeUpdateAttemptedRef.current = false;
      toast.error(state.message);
    } else if (!state.success) {
      // If action failed without a message, still reset the flag
      storeUpdateAttemptedRef.current = false;
    }
    // Depend on the entire state object to react to changes
  }, [state, setUserDetails]);

  // Read the name directly from the Zustand store for display
  const effectiveUserName = currentName;

  return (
    <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 calc(100% - 250px - 48px)' } }}>
      <Stack spacing={4}>
        <NameEditSection
          // Pass the current name from the store to the edit section
          user={{ ...user, id: userId || '', name: effectiveUserName || '' }}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          formAction={handleFormSubmit}
          state={state}
        />
        <Divider />
        {/* Use email from store if available, fallback to initial prop */}
        <ProfileField label="Email" value={email || user.email} />
        <Divider />
        {/* Use id from store if available, fallback to initial prop */}
        <ProfileField label="User ID" value={userId || user.id} />
        <Divider />
        <SignOutButton />
      </Stack>
    </Box>
  );
}
