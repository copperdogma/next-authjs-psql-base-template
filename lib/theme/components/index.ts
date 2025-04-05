'use client';

import { PaletteMode, Theme } from '@mui/material';
import { Components } from '@mui/material/styles';
import { getScrollbarStyles } from './scrollbar';
import { getCardAndPaperOverrides, getAppBarOverrides, getCardContentOverrides } from './surfaces';
import { getButtonOverrides, getFormComponentOverrides } from './inputs';

/**
 * Get component overrides for the theme
 */
export const getComponentOverrides = (mode: PaletteMode): Components<Theme> => ({
  MuiCssBaseline: {
    styleOverrides: {
      ...getScrollbarStyles(mode),
    },
  },
  MuiButton: getButtonOverrides(mode),
  MuiPaper: getCardAndPaperOverrides(),
  MuiAppBar: getAppBarOverrides(),
  MuiCard: getCardAndPaperOverrides(),
  ...getCardContentOverrides(),
  ...getFormComponentOverrides(mode),
});
