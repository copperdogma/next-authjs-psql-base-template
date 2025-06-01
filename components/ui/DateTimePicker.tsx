'use client';

import React from 'react';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TextFieldProps } from '@mui/material/TextField';
import { Dayjs } from 'dayjs';

export interface DateTimePickerProps {
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
  label: string;
  error?: boolean;
  helperText?: React.ReactNode;
  textFieldProps?: Partial<TextFieldProps>;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  disabled?: boolean;
  required?: boolean;
  disablePast?: boolean;
  disableFuture?: boolean;
  inputFormat?: string;
  views?: Array<'year' | 'month' | 'day' | 'hours' | 'minutes'>;
}

/**
 * DateTimePicker component.
 *
 * A mobile-friendly date and time picker component that integrates with Material UI.
 * This component is designed to be easy to use with react-hook-form through its Controller component.
 *
 * @example
 * // Basic usage
 * <DateTimePicker
 *   label="Appointment Time"
 *   value={value}
 *   onChange={setValue}
 * />
 *
 * @example
 * // With react-hook-form
 * <Controller
 *   name="appointmentTime"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <DateTimePicker
 *       label="Appointment Time"
 *       value={field.value}
 *       onChange={field.onChange}
 *       error={!!fieldState.error}
 *       helperText={fieldState.error?.message}
 *     />
 *   )}
 * />
 */
export function DateTimePicker({
  value,
  onChange,
  label,
  error,
  helperText,
  textFieldProps,
  minDate,
  maxDate,
  disabled,
  required,
  disablePast,
  disableFuture,
  inputFormat,
  views,
}: DateTimePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MobileDateTimePicker
        label={label}
        value={value}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        disablePast={disablePast}
        disableFuture={disableFuture}
        format={inputFormat}
        views={views}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: 'outlined',
            error,
            helperText,
            required,
            ...textFieldProps,
          },
        }}
      />
    </LocalizationProvider>
  );
}

export default DateTimePicker;
