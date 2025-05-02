'use client';

import { useState, useEffect, useActionState, useRef, useCallback } from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { User } from 'next-auth';
import SignOutButton from './SignOutButton';
import { updateUserName, UpdateUserNameFormState } from '@/app/profile/actions'; // Import type
// import { useSession } from 'next-auth/react'; // No longer needed for update
import { useUserStore } from '@/lib/store/userStore'; // Import Zustand store
import NameEditSection from './NameEditSection';
import ProfileField from './ProfileField';
import { toast } from '@/components/ui/Toaster'; // Import toast

// Custom Hook for Profile Details Logic
const useProfileDetails = (
  /* userId: string | null, */ currentName: string | null,
  setUserDetails: (details: Partial<User>) => void
) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [state, formAction] = useActionState<UpdateUserNameFormState, FormData>(updateUserName, {
    message: '',
    success: false,
    updatedName: null,
  });
  const storeUpdateAttemptedRef = useRef(false);

  const handleFormSubmit = useCallback(
    async (formData: FormData) => {
      storeUpdateAttemptedRef.current = false; // Reset attempt flag on new submit
      return formAction(formData);
    },
    [formAction]
  ); // Depend on formAction

  useEffect(() => {
    if (state.success && state.updatedName && !storeUpdateAttemptedRef.current) {
      storeUpdateAttemptedRef.current = true;
      setIsEditingName(false);
      console.log('Profile action success, updating Zustand store with:', {
        name: state.updatedName,
      });
      setUserDetails({ name: state.updatedName });
      if (state.message) {
        toast.success(state.message);
      }
    } else if (!state.success && state.message) {
      storeUpdateAttemptedRef.current = false;
      toast.error(state.message);
    } else if (!state.success) {
      storeUpdateAttemptedRef.current = false;
    }
  }, [state, setUserDetails]);

  return {
    isEditingName,
    setIsEditingName,
    state,
    handleFormSubmit,
    effectiveUserName: currentName, // Pass current name from store
    formAction, // Return formAction if NameEditSection needs it directly (might not)
  };
};

interface ProfileDetailsSectionProps {
  user: User; // Keep initial user prop for non-name fields
}

// Main Component
export default function ProfileDetailsSection({ user }: ProfileDetailsSectionProps) {
  // Get user details and update action from Zustand store
  const {
    id: userIdFromStore,
    name: currentNameFromStore,
    email: emailFromStore,
    setUserDetails,
  } = useUserStore();

  // Use the custom hook
  const {
    isEditingName,
    setIsEditingName,
    state,
    handleFormSubmit,
    effectiveUserName,
    // formAction - Not directly needed by NameEditSection if handleFormSubmit is used
  } = useProfileDetails(currentNameFromStore, setUserDetails);

  // Combine store and initial prop values for display
  const displayUserId = userIdFromStore || user.id;
  const displayEmail = emailFromStore || user.email;
  const displayUserName = effectiveUserName || user.name; // Fallback to prop if store is empty initially

  return (
    <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 calc(100% - 250px - 48px)' } }}>
      <Stack spacing={4}>
        <NameEditSection
          // Pass combined/effective user details
          user={{ ...user, id: displayUserId || '', name: displayUserName || '' }}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          formAction={handleFormSubmit} // Use the wrapped submit handler from the hook
          state={state}
        />
        <Divider />
        {/* Use combined/effective email */}
        <ProfileField label="Email" value={displayEmail} />
        <Divider />
        {/* Use combined/effective user ID */}
        <ProfileField label="User ID" value={displayUserId} />
        <Divider />
        <SignOutButton />
      </Stack>
    </Box>
  );
}
