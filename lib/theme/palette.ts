'use client';

import { red, blue, grey, lightBlue } from '@mui/material/colors';

/**
 * Enhanced color palette with better contrast for accessibility
 * Using separate light and dark mode palettes for optimal contrast ratios
 */
export const PALETTE = {
  light: {
    primary: {
      main: blue[700], // Good contrast with white
      dark: blue[800],
      light: blue[500],
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1e88e5',
      dark: '#0d47a1',
      light: '#4791db',
      contrastText: '#ffffff',
    },
    error: {
      main: red[700],
      dark: red[900],
      light: red[500],
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121', // Darker for better readability
      secondary: '#424242', // Darker for better contrast
    },
    divider: grey[300],
    action: {
      active: 'rgba(0, 0, 0, 0.7)', // Darker for better visibility
      hover: 'rgba(0, 0, 0, 0.1)',
      selected: 'rgba(0, 0, 0, 0.15)',
    },
  },
  dark: {
    primary: {
      main: lightBlue[300], // Lighter blue for dark mode - better contrast
      dark: lightBlue[400],
      light: lightBlue[200],
      contrastText: '#000000', // Black text on light blue
    },
    secondary: {
      main: '#64b5f6', // Lighter blue for dark mode
      dark: '#42a5f5',
      light: '#90caf9',
      contrastText: '#000000',
    },
    error: {
      main: red[400], // Lighter red for dark mode
      dark: red[500],
      light: red[300],
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5', // Lighter for better visibility on dark backgrounds
    },
    divider: grey[700],
    action: {
      active: 'rgba(255, 255, 255, 0.7)', // Brighter for better visibility in dark mode
      hover: 'rgba(255, 255, 255, 0.1)',
      selected: 'rgba(255, 255, 255, 0.15)',
    },
  },
};

/**
 * Define spacing constants for consistent use throughout the app
 */
export const SPACING_UNIT = 8;
