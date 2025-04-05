'use client';

import { TypographyVariantsOptions } from '@mui/material';

/**
 * Typography heading variants
 */
export const headingVariants: Pick<
  TypographyVariantsOptions,
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
> = {
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
};

/**
 * Typography text variants
 */
export const textVariants: Pick<
  TypographyVariantsOptions,
  'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'button'
> = {
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },
  button: {
    textTransform: 'none' as const,
    fontWeight: 500,
    letterSpacing: '0.02857em',
  },
};
