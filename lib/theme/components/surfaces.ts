'use client';

import { Theme } from '@mui/material';

/**
 * Get card and paper overrides for consistent styling
 */
export const getCardAndPaperOverrides = () => ({
  styleOverrides: {
    root: {
      backgroundImage: 'none',
      borderRadius: 12,
      transition: 'all 0.2s ease-in-out',
      overflow: 'hidden',
    },
  },
});

/**
 * Get AppBar component styles
 */
export const getAppBarOverrides = () => ({
  styleOverrides: {
    root: ({ theme }: { theme: Theme }) => ({
      boxShadow: theme.shadows[1],
    }),
  },
});

/**
 * Get Card header and content styles
 */
export const getCardContentOverrides = () => ({
  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: 16,
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 16,
        '&:last-child': {
          paddingBottom: 16,
        },
      },
    },
  },
});
