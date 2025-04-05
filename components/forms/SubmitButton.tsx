'use client';

import { Button } from '../ui/Button';

interface SubmitButtonProps {
  isSubmitting: boolean;
  text: string;
}

export default function SubmitButton({ isSubmitting, text }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      variant="contained"
      fullWidth
      data-testid="form-submit"
    >
      {isSubmitting ? 'Submitting...' : text}
    </Button>
  );
}
