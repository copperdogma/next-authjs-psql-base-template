'use client';

import { TypographyVariantsOptions } from '@mui/material';
import { headingVariants, textVariants } from './variants';

// Default font stack
const fontFamily = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
].join(',');

/**
 * Get typography configuration for the theme
 */
export const getTypography = (): TypographyVariantsOptions => ({
  fontFamily,
  ...headingVariants,
  ...textVariants,
});
