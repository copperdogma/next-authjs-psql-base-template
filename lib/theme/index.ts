'use client';

import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Re-export all theme components
export * from './palette';
export * from './typography';
export * from './components';
export * from './tokens';

// Create theme function
export const createAppTheme = (mode: PaletteMode) => {
  const { getDesignTokens } = require('./tokens');
  const theme = createTheme(getDesignTokens(mode));
  return responsiveFontSizes(theme);
};
