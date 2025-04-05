'use client';

import { PaletteMode } from '@mui/material';

/**
 * Get scrollbar styles based on current theme mode
 */
export const getScrollbarStyles = (mode: PaletteMode) => ({
  body: {
    scrollbarColor: mode === 'dark' ? '#6b6b6b #2b2b2b' : '#959595 #f5f5f5',
    '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
      width: 8,
      height: 8,
      backgroundColor: mode === 'dark' ? '#2b2b2b' : '#f5f5f5',
    },
    '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
      borderRadius: 8,
      backgroundColor: mode === 'dark' ? '#6b6b6b' : '#959595',
      minHeight: 24,
    },
    '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
      backgroundColor: mode === 'dark' ? '#818181' : '#bdbdbd',
    },
    '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
      backgroundColor: mode === 'dark' ? '#818181' : '#bdbdbd',
    },
    '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
      backgroundColor: mode === 'dark' ? '#818181' : '#bdbdbd',
    },
  },
});
