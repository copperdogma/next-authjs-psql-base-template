'use client';

import { memo, forwardRef } from 'react';
import { Checkbox, FormControlLabel, CheckboxProps } from '@mui/material';
import { UseFormRegisterReturn } from 'react-hook-form';

// Define props, including a label and react-hook-form registration props
export interface RememberMeCheckboxProps extends Omit<CheckboxProps, 'name'> {
  label?: string; // Optional label text
  // Include necessary props from register return type
  name: UseFormRegisterReturn['name'];
  onChange: UseFormRegisterReturn['onChange'];
  onBlur: UseFormRegisterReturn['onBlur'];
  ref: UseFormRegisterReturn['ref'];
}

/**
 * Checkbox component specifically for "Remember Me" functionality,
 * integrated with react-hook-form.
 */
const RememberMeCheckbox = forwardRef<HTMLButtonElement, RememberMeCheckboxProps>(
  ({ label = 'Remember Me', name = 'rememberMe', onChange, onBlur, ...rest }, ref) => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            name={name} // Pass name to underlying checkbox
            onChange={onChange} // Pass react-hook-form handler
            onBlur={onBlur} // Pass react-hook-form handler
            inputRef={ref} // Connect react-hook-form ref
            color="primary"
            {...rest} // Pass other CheckboxProps like checked, disabled etc.
          />
        }
        label={label} // Use the passed label prop
      />
    );
  }
);

RememberMeCheckbox.displayName = 'RememberMeCheckbox';

export default memo(RememberMeCheckbox);
