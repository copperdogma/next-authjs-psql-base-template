'use client';

import { PaletteMode } from '@mui/material';
import { PALETTE } from '../palette';

/**
 * Get button component styles
 */
export const getButtonOverrides = (mode: PaletteMode) => ({
  styleOverrides: {
    root: {
      borderRadius: 8,
      padding: '8px 16px',
      transition: 'all 0.2s',
      fontWeight: 500,
    },
    contained: ({ theme }: { theme: any }) => ({
      boxShadow: theme.shadows[1],
      '&:hover': {
        boxShadow: theme.shadows[2],
      },
    }),
    outlined: {
      borderWidth: 1.5,
      '&:hover': {
        borderWidth: 1.5,
      },
    },
    sizeMedium: {
      '&:focus-visible': {
        outline: '2px solid',
        outlineColor: mode === 'light' ? PALETTE.light.primary.main : PALETTE.dark.primary.main,
        outlineOffset: 2,
      },
    },
  },
});

/**
 * Get form component styles
 */
export const getFormComponentOverrides = (mode: PaletteMode) => ({
  MuiFormLabel: {
    styleOverrides: {
      root: {
        marginBottom: 4,
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        color: mode === 'light' ? PALETTE.light.text.primary : PALETTE.dark.text.primary,
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiButtonBase: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
});
