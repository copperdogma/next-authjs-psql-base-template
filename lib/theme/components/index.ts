'use client';

import { PaletteMode, Theme } from '@mui/material';
import { Components } from '@mui/material/styles';
import { getScrollbarStyles } from './scrollbar';
import { getCardAndPaperOverrides, getAppBarOverrides, getCardContentOverrides } from './surfaces';
import { getButtonOverrides, getFormComponentOverrides } from './inputs';

// Helper for MuiAlert overrides
const getAlertOverrides = (mode: PaletteMode): Components<Theme>['MuiAlert'] => ({
  styleOverrides: {
    root: ({ theme }) => ({
      ...(mode === 'dark' && {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }),
    }),
  },
});

// Helper for MuiDialog overrides
const getDialogOverrides = (mode: PaletteMode): Components<Theme>['MuiDialog'] => ({
  styleOverrides: {
    paper: ({ theme }) => ({
      ...(mode === 'dark' && {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }),
    }),
  },
});

/**
 * Get component overrides for the theme
 */
export const getComponentOverrides = (mode: PaletteMode): Components<Theme> => ({
  MuiCssBaseline: {
    styleOverrides: {
      ...getScrollbarStyles(mode),
      // Migrate .theme-aware-paper overrides from globals.css
      '.theme-aware-paper': {
        backgroundColor: (theme: Theme) => theme.palette.background.paper,
        color: (theme: Theme) => theme.palette.text.primary,
      },
      // Migrate .MuiPaper-root .MuiBox-root (Box inside Paper) if needed
      '.MuiPaper-root .MuiBox-root': {
        backgroundColor: (theme: Theme) => theme.palette.background.paper,
      },
    },
  },
  MuiButton: getButtonOverrides(mode),
  MuiPaper: {
    ...getCardAndPaperOverrides(),
    styleOverrides: {
      root: ({ theme }) => ({
        ...(mode === 'dark' && {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }),
      }),
    },
  },
  MuiAppBar: getAppBarOverrides(),
  MuiCard: {
    ...getCardAndPaperOverrides(),
    styleOverrides: {
      root: ({ theme }) => ({
        ...(mode === 'dark' && {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }),
      }),
    },
  },
  MuiAlert: getAlertOverrides(mode),
  MuiDialog: getDialogOverrides(mode),
  // NOTE: Do NOT add a global override for MuiBox. Use sx or styled() for specific Box instances.
  ...getCardContentOverrides(),
  ...getFormComponentOverrides(mode),
});
