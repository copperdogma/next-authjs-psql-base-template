'use client';

import { PaletteMode } from '@mui/material';
import { ThemeOptions } from '@mui/material/styles';
import { PALETTE } from './palette';
import { getTypography } from './typography';
import { getComponentOverrides } from './components';

/**
 * Build theme design tokens based on mode (light/dark)
 */
export const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light' ? PALETTE.light : PALETTE.dark),
  },
  typography: getTypography(),
  components: getComponentOverrides(mode),
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 6px rgba(0, 0, 0, 0.07)',
    '0px 6px 8px rgba(0, 0, 0, 0.09)',
    '0px 8px 12px rgba(0, 0, 0, 0.1)',
    '0px 10px 14px rgba(0, 0, 0, 0.12)',
    '0px 12px 16px rgba(0, 0, 0, 0.14)',
    '0px 14px 18px rgba(0, 0, 0, 0.16)',
    '0px 16px 20px rgba(0, 0, 0, 0.18)',
    '0px 18px 22px rgba(0, 0, 0, 0.2)',
    '0px 20px 24px rgba(0, 0, 0, 0.22)',
    '0px 22px 26px rgba(0, 0, 0, 0.24)',
    '0px 24px 28px rgba(0, 0, 0, 0.26)',
    '0px 26px 30px rgba(0, 0, 0, 0.28)',
    '0px 28px 32px rgba(0, 0, 0, 0.3)',
    '0px 30px 34px rgba(0, 0, 0, 0.32)',
    '0px 32px 36px rgba(0, 0, 0, 0.34)',
    '0px 34px 38px rgba(0, 0, 0, 0.36)',
    '0px 36px 40px rgba(0, 0, 0, 0.38)',
    '0px 38px 42px rgba(0, 0, 0, 0.4)',
    '0px 40px 44px rgba(0, 0, 0, 0.42)',
    '0px 42px 46px rgba(0, 0, 0, 0.44)',
    '0px 44px 48px rgba(0, 0, 0, 0.46)',
    '0px 46px 50px rgba(0, 0, 0, 0.48)',
    '0px 48px 52px rgba(0, 0, 0, 0.5)',
  ],
});
