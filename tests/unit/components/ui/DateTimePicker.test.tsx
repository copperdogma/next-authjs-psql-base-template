import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import dayjs from 'dayjs';

// Mock the LocalizationProvider and MobileDateTimePicker to avoid rendering issues in tests
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@mui/x-date-pickers/MobileDateTimePicker', () => ({
  MobileDateTimePicker: ({ label, value, onChange, slotProps }: any) => {
    return (
      <div data-testid="mock-date-time-picker">
        <label>{label}</label>
        <input
          data-testid="mock-date-input"
          value={value ? value.format('YYYY-MM-DD HH:mm') : ''}
          onChange={e => onChange(dayjs(e.target.value))}
          aria-label={label}
        />
        {slotProps.textField.error && (
          <span data-testid="mock-error-message">{slotProps.textField.helperText}</span>
        )}
      </div>
    );
  },
}));

describe('DateTimePicker', () => {
  it('renders with a label', () => {
    const onChange = jest.fn();
    render(<DateTimePicker label="Test Date" value={null} onChange={onChange} />);

    expect(screen.getByText('Test Date')).toBeInTheDocument();
  });

  it('displays error message when error prop is true', () => {
    const onChange = jest.fn();
    render(
      <DateTimePicker
        label="Test Date"
        value={null}
        onChange={onChange}
        error={true}
        helperText="This field is required"
      />
    );

    expect(screen.getByTestId('mock-error-message')).toHaveTextContent('This field is required');
  });

  it('calls onChange when date changes', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<DateTimePicker label="Test Date" value={null} onChange={onChange} />);

    const input = screen.getByTestId('mock-date-input');
    await user.clear(input);
    await user.type(input, '2023-01-01 12:00');

    expect(onChange).toHaveBeenCalled();
  });
});
