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
    styleOverrides: theme => ({
      ...getScrollbarStyles(theme.palette.mode),
      // Migrate .theme-aware-paper overrides from globals.css
      '.theme-aware-paper': {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      },
    }),
  },
  MuiButton: getButtonOverrides(mode),
  MuiPaper: {
    ...getCardAndPaperOverrides(),
  },
  MuiAppBar: getAppBarOverrides(),
  MuiCard: {
    ...getCardAndPaperOverrides(),
  },
  MuiAlert: getAlertOverrides(mode),
  MuiDialog: getDialogOverrides(mode),
  // NOTE: Do NOT add a global override for MuiBox. Use sx or styled() for specific Box instances.
  ...getCardContentOverrides(),
  ...getFormComponentOverrides(mode),
});
