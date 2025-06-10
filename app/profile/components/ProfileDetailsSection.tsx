'use client';

import { useState, useEffect, useActionState, useRef, useCallback } from 'react';
import { Box, Divider, Stack } from '@mui/material';
import { User } from 'next-auth';
import SignOutButton from './SignOutButton';
// import { useSession } from 'next-auth/react'; // No longer needed for update
import { useUserStore } from '@/lib/store/userStore'; // Import Zustand store
import NameEditSection from './NameEditSection';
import { toast } from '@/components/ui/Toaster'; // Import toast
import ProfileField from './ProfileField'; // Correct default import
import { updateUserName, NameUpdateState } from '@/app/profile/actions'; // Use correct type
import { logger } from '@/lib/logger';

// Custom Hook for Profile Details Logic
/**
 * Custom hook to manage the logic for editing and displaying profile details,
 * specifically for updating the user's name.
 *
 * It handles:
 * - Local state for edit mode (`isEditingName`).
 * - Interaction with the `updateUserName` server action using `useActionState`.
 * - Displaying success/error messages via toast notifications.
 * - Syncing updated user details back to the global Zustand `userStore`.
 *
 * @param {string | null} currentName - The current name of the user, typically from the Zustand store.
 * @param {(details: Partial<User>) => void} setUserDetails - The Zustand store action to update user details.
 * @returns {object} An object containing:
 *  - `isEditingName`: Boolean state indicating if the name field is in edit mode.
 *  - `setIsEditingName`: Function to toggle the `isEditingName` state.
 *  - `state`: The state returned by `useActionState` from the `updateUserName` server action (contains `message`, `success`, `updatedName`).
 *  - `handleFormSubmit`: A memoized function to wrap the `formAction` from `useActionState`, ensuring `storeUpdateAttemptedRef` is reset.
 *  - `effectiveUserName`: The current name to be displayed, derived from the `currentName` prop.
 *  - `formAction`: The action function returned by `useActionState` to be passed to the form.
 */
const useProfileDetails = (
  /* userId: string | null, */ currentName: string | null,
  setUserDetails: (details: Partial<User>) => void
) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [state, formAction] = useActionState<NameUpdateState, FormData>(updateUserName, {
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
      logger.info('Profile action success, updating Zustand store with:', {
        updatedName: state.updatedName,
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
