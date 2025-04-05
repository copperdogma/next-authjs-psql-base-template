'use client';

import {
  createTheme,
  responsiveFontSizes,
  ThemeOptions,
  Components,
  Theme,
} from '@mui/material/styles';
import { red, blue, grey, lightBlue } from '@mui/material/colors';
import { PaletteMode, TypographyVariantsOptions } from '@mui/material';

/**
 * Define spacing constants for consistent use throughout the app
 * These will be referenced in the theme
 */
const SPACING_UNIT = 8;

/**
 * Enhanced color palette with better contrast for accessibility
 * Using separate light and dark mode palettes for optimal contrast ratios
 */
const PALETTE = {
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
 * Get typography configuration for the theme
 */
const getTypography = (): TypographyVariantsOptions => ({
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
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
});

/**
 * Get scrollbar styles based on current theme mode
 */
const getScrollbarStyles = (mode: PaletteMode) => ({
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

/**
 * Get component overrides for the theme
 */
const getComponentOverrides = (mode: PaletteMode): Components<Theme> => ({
  MuiCssBaseline: {
    styleOverrides: {
      ...getScrollbarStyles(mode),
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
        transition: 'all 0.2s',
        fontWeight: 500,
      },
      contained: ({ theme }: { theme: Theme }) => ({
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
      // Improve focus visibility for accessibility
      sizeMedium: {
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: mode === 'light' ? PALETTE.light.primary.main : PALETTE.dark.primary.main,
          outlineOffset: 2,
        },
      },
    },
  },
  MuiPaper: getCardAndPaperOverrides(mode),
  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        boxShadow: theme.shadows[1],
      }),
    },
  },
  MuiCard: getCardAndPaperOverrides(mode),
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
  MuiCardActions: {
    styleOverrides: {
      root: {
        padding: '8px 16px',
      },
    },
  },
  MuiLink: {
    defaultProps: {
      underline: 'hover' as const,
    },
  },
  MuiTable: {
    styleOverrides: {
      root: {
        tableLayout: 'fixed',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${mode === 'dark' ? PALETTE.dark.divider : PALETTE.light.divider}`,
      },
      head: {
        fontWeight: 600,
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:last-child td': {
          borderBottom: 0,
        },
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: mode === 'light' ? PALETTE.light.primary.main : PALETTE.dark.primary.main,
          outlineOffset: -2,
        },
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: mode === 'light' ? PALETTE.light.primary.main : PALETTE.dark.primary.main,
          outlineOffset: -2,
        },
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        '&.Mui-focused': {
          outlineOffset: 2,
        },
      },
    },
  },
});

/**
 * Get card and paper shared overrides
 */
const getCardAndPaperOverrides = (mode: PaletteMode) => ({
  styleOverrides: {
    root: {
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      color: mode === 'dark' ? '#ffffff' : '#212121',
      boxShadow:
        mode === 'dark' ? '0px 3px 15px rgba(0, 0, 0, 0.4)' : '0px 3px 15px rgba(0, 0, 0, 0.1)',
    },
  },
});

/**
 * Generate theme options based on selected palette mode
 *
 * @param mode - The palette mode ('light' or 'dark')
 * @returns ThemeOptions object with configured tokens
 */
const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  // Set consistent spacing
  spacing: SPACING_UNIT,

  palette: {
    mode,
    ...(mode === 'light' ? PALETTE.light : PALETTE.dark),
  },

  typography: getTypography(),

  components: getComponentOverrides(mode),
});

/**
 * Create and export a base theme with shared configuration
 * This theme is not intended to be used directly
 */
export const theme = {
  spacing: SPACING_UNIT,
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.1)',
    '0px 4px 8px rgba(0, 0, 0, 0.1)',
    '0px 8px 16px rgba(0, 0, 0, 0.1)',
    '0px 12px 24px rgba(0, 0, 0, 0.1)',
    '0px 16px 32px rgba(0, 0, 0, 0.1)',
    '0px 20px 40px rgba(0, 0, 0, 0.1)',
    '0px 24px 48px rgba(0, 0, 0, 0.1)',
    '0px 28px 56px rgba(0, 0, 0, 0.1)',
    '0px 32px 64px rgba(0, 0, 0, 0.1)',
    '0px 36px 72px rgba(0, 0, 0, 0.1)',
    '0px 40px 80px rgba(0, 0, 0, 0.1)',
    '0px 44px 88px rgba(0, 0, 0, 0.1)',
    '0px 48px 96px rgba(0, 0, 0, 0.1)',
    '0px 52px 104px rgba(0, 0, 0, 0.1)',
    '0px 56px 112px rgba(0, 0, 0, 0.1)',
    '0px 60px 120px rgba(0, 0, 0, 0.1)',
    '0px 64px 128px rgba(0, 0, 0, 0.1)',
    '0px 68px 136px rgba(0, 0, 0, 0.1)',
    '0px 72px 144px rgba(0, 0, 0, 0.1)',
    '0px 76px 152px rgba(0, 0, 0, 0.1)',
    '0px 80px 160px rgba(0, 0, 0, 0.1)',
    '0px 84px 168px rgba(0, 0, 0, 0.1)',
    '0px 88px 176px rgba(0, 0, 0, 0.1)',
    '0px 92px 184px rgba(0, 0, 0, 0.1)',
  ],
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};

/**
 * Create and export pre-generated themes for light and dark modes
 * These themes can be used directly without recreating them on each render
 */
export const lightTheme = responsiveFontSizes(createTheme(getDesignTokens('light')));
export const darkTheme = responsiveFontSizes(createTheme(getDesignTokens('dark')));

/**
 * Utility function to get a time-based theme
 * Returns 'dark' during evening/night hours (7PM-7AM) and 'light' during the day
 *
 * @returns 'light' or 'dark' based on the current time
 */
export function getTimeBasedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'; // Default to light on server

  const hour = new Date().getHours();
  return hour >= 19 || hour < 7 ? 'dark' : 'light';
}

// Export the spacing unit for consistent use in custom styles
export const SPACING = SPACING_UNIT;

// Use a theme provider to switch between light and dark modes
