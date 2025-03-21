import { createTheme, ThemeOptions } from '@mui/material/styles';

// Base theme options that are common across light and dark modes
const baseThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: [
      'var(--font-roboto)',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevents automatic uppercase transformation
          borderRadius: '0.375rem', // Tailwind's rounded-md
          fontWeight: 500,
          boxShadow: 'none',
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlinedPrimary: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem', // Tailwind's rounded-lg
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', // Tailwind's shadow-sm
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.375rem', // Tailwind's rounded-md
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '0.375rem', // Tailwind's rounded-md
        },
        input: {
          padding: '0.75rem 1rem',
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginLeft: '0.25rem',
          fontSize: '0.75rem',
        },
      },
    },
  },
};

// Create a theme instance that integrates with our Tailwind configuration
export const theme: ThemeOptions = {
  ...baseThemeOptions,
  palette: {
    primary: {
      main: '#0ea5e9', // Tailwind's primary.500
      light: '#38bdf8', // Tailwind's primary.400
      dark: '#0284c7', // Tailwind's primary.600
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    error: {
      main: '#ef4444', // Tailwind's red-500
      light: '#f87171', // Tailwind's red-400
      dark: '#dc2626', // Tailwind's red-600
    },
    warning: {
      main: '#f59e0b', // Tailwind's amber-500
      light: '#fbbf24', // Tailwind's amber-400
      dark: '#d97706', // Tailwind's amber-600
    },
    info: {
      main: '#3b82f6', // Tailwind's blue-500
      light: '#60a5fa', // Tailwind's blue-400
      dark: '#2563eb', // Tailwind's blue-600
    },
    success: {
      main: '#10b981', // Tailwind's emerald-500
      light: '#34d399', // Tailwind's emerald-400
      dark: '#059669', // Tailwind's emerald-600
    },
    background: {
      default: '#ffffff', // Light mode background
      paper: '#ffffff', // Light mode paper background
    },
    text: {
      primary: '#111827', // Tailwind's gray-900 (foreground)
      secondary: '#4b5563', // Tailwind's gray-600 (muted)
    },
  },
}; 