'use client';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker as MuiDateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { TextField } from '@mui/material';
import { forwardRef } from 'react';

interface DateTimePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  helperText?: string;
}

const DateTimePicker = forwardRef<HTMLDivElement, DateTimePickerProps>(
  ({ label, value, onChange, minDate, maxDate, disabled, className, error, helperText, ...props }, ref) => {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MuiDateTimePicker
          {...props}
          label={label}
          value={value}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          className={className}
          slots={{
            textField: (params) => (
              <TextField
                {...params}
                error={error}
                helperText={helperText}
                className="w-full"
              />
            ),
          }}
          ref={ref}
        />
      </LocalizationProvider>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker; 