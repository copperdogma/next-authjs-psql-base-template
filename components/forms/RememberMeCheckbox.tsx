'use client';

import { Checkbox, FormControlLabel } from '@mui/material';

interface RememberMeCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function RememberMeCheckbox({ checked, onChange }: RememberMeCheckboxProps) {
  return (
    <FormControlLabel
      control={
        <Checkbox
          id="rememberMe"
          name="rememberMe"
          checked={checked}
          onChange={onChange}
          color="primary"
        />
      }
      label="Remember me"
    />
  );
}
