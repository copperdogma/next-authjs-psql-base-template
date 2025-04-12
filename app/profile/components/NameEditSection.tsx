'use client';

import { Box, Typography, Button, TextField } from '@mui/material';
import { User } from 'next-auth';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useEffect } from 'react';
import { toast } from '@/components/ui/Toaster';

interface NameEditSectionProps {
  user: User;
  isEditingName: boolean;
  setIsEditingName: (isEditing: boolean) => void;
  formAction: (payload: FormData) => void;
  state: {
    message: string;
    success: boolean;
  };
}

/**
 * Section header with edit button
 */
function SectionHeader({
  isEditingName,
  setIsEditingName,
}: {
  isEditingName: boolean;
  setIsEditingName: (isEditing: boolean) => void;
}) {
  return (
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
  );
}

/**
 * Display name value when not editing
 */
function DisplayNameValue({ name }: { name: string | null | undefined }) {
  return (
    <Typography variant="h6" sx={{ mt: 1 }}>
      {name || 'Not provided'}
    </Typography>
  );
}

export default function NameEditSection({
  user,
  isEditingName,
  setIsEditingName,
  formAction,
  state,
}: NameEditSectionProps) {
  // Show toast notification when state changes
  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state.message, state.success]);

  return (
    <Box>
      <SectionHeader isEditingName={isEditingName} setIsEditingName={setIsEditingName} />

      {isEditingName ? (
        <EditNameForm
          defaultValue={user.name || null}
          formAction={formAction}
          state={state}
          onCancel={() => setIsEditingName(false)}
        />
      ) : (
        <DisplayNameValue name={user.name} />
      )}
    </Box>
  );
}

interface EditNameFormProps {
  defaultValue: string | null;
  formAction: (payload: FormData) => void;
  state: {
    message: string;
    success: boolean;
  };
  onCancel: () => void;
}

function EditNameForm({ defaultValue, formAction, state, onCancel }: EditNameFormProps) {
  return (
    <form action={formAction}>
      <Box sx={{ mt: 1 }}>
        <TextField
          name="name"
          defaultValue={defaultValue || ''}
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
            onClick={onCancel}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </form>
  );
}
