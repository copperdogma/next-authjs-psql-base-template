import { getComponentOverrides } from '@/lib/theme/components';
import { createTheme, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Mock helper functions from other modules to isolate testing of index.ts
jest.mock('@/lib/theme/components/scrollbar', () => ({
  getScrollbarStyles: jest.fn(() => ({ scrollbarColor: '#6b6b6b #2b2b2b' })),
}));

jest.mock('@/lib/theme/components/surfaces', () => ({
  getCardAndPaperOverrides: jest.fn(() => ({
    MuiCard: { styleOverrides: { root: { boxShadow: 'none' } } },
  })),
  getAppBarOverrides: jest.fn(() => ({
    MuiAppBar: { styleOverrides: { root: { backgroundColor: 'transparent' } } },
  })),
  getCardContentOverrides: jest.fn(() => ({
    MuiCardContent: { styleOverrides: { root: { padding: 0 } } },
  })),
}));

jest.mock('@/lib/theme/components/inputs', () => ({
  getButtonOverrides: jest.fn((mode: PaletteMode) => ({
    MuiButton: { styleOverrides: { root: { color: mode === 'dark' ? 'white' : 'black' } } },
  })),
  getFormComponentOverrides: jest.fn((mode: PaletteMode) => ({
    MuiTextField: { styleOverrides: { root: { borderColor: mode === 'dark' ? 'blue' : 'red' } } },
  })),
}));

const generateMockTheme = (mode: PaletteMode): Theme =>
  createTheme({
    palette: {
      mode,
      background: {
        paper: mode === 'dark' ? '#121212' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#000000',
      },
      // Add other necessary palette properties if your components rely on them
    },
  });

describe('getComponentOverrides', () => {
  it('should return default overrides for light mode', () => {
    const mode: PaletteMode = 'light';
    const theme = generateMockTheme(mode);
    const overrides = getComponentOverrides(mode);

    expect(overrides.MuiCssBaseline).toBeDefined();
    expect(overrides.MuiButton).toBeDefined();
    expect(overrides.MuiPaper).toBeDefined();
    expect(overrides.MuiAppBar).toBeDefined();
    expect(overrides.MuiCard).toBeDefined();
    expect(overrides.MuiAlert).toBeDefined();
    expect(overrides.MuiDialog).toBeDefined();

    // Test MuiAlert light mode
    const alertStyleOverrides = overrides.MuiAlert?.styleOverrides?.root;
    if (typeof alertStyleOverrides === 'function') {
      const alertStyles = alertStyleOverrides({ theme, ownerState: {} as any });
      expect(alertStyles).toEqual({}); // No specific overrides in light mode
    } else {
      fail('MuiAlert styleOverrides should be a function');
    }

    // Test MuiDialog light mode
    const dialogStyleOverrides = overrides.MuiDialog?.styleOverrides?.paper;
    if (typeof dialogStyleOverrides === 'function') {
      const dialogStyles = dialogStyleOverrides({
        theme,
        ownerState: {} as any,
        open: true,
        fullWidth: false,
        fullScreen: false,
      });
      expect(dialogStyles).toEqual({}); // No specific overrides in light mode
    } else {
      fail('MuiDialog styleOverrides should be a function');
    }
  });

  it('should apply specific overrides for MuiAlert in dark mode', () => {
    const mode: PaletteMode = 'dark';
    const theme = generateMockTheme(mode);
    const overrides = getComponentOverrides(mode);

    expect(overrides.MuiAlert).toBeDefined();
    const styleOverrides = overrides.MuiAlert?.styleOverrides?.root;
    expect(typeof styleOverrides).toBe('function');

    if (typeof styleOverrides === 'function') {
      const styles = styleOverrides({ theme, ownerState: {} as any });
      expect(styles).toEqual({
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      });
    }
  });

  it('should apply specific overrides for MuiDialog in dark mode', () => {
    const mode: PaletteMode = 'dark';
    const theme = generateMockTheme(mode);
    const overrides = getComponentOverrides(mode);
    expect(overrides.MuiDialog).toBeDefined();
    const styleOverrides = overrides.MuiDialog?.styleOverrides?.paper;
    expect(typeof styleOverrides).toBe('function');
    if (typeof styleOverrides === 'function') {
      const styles = styleOverrides({
        theme,
        ownerState: {} as any,
        open: true,
        fullWidth: false,
        fullScreen: false,
      });
      expect(styles).toEqual({
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      });
    }
  });

  it('should include scrollbar styles from getScrollbarStyles', () => {
    const mode: PaletteMode = 'light';
    const theme = generateMockTheme(mode);
    const overrides = getComponentOverrides(mode);
    const cssBaselineOverrides = overrides.MuiCssBaseline?.styleOverrides;
    const styles =
      typeof cssBaselineOverrides === 'function'
        ? cssBaselineOverrides(theme)
        : cssBaselineOverrides;
    expect(styles).toHaveProperty('scrollbarColor', '#6b6b6b #2b2b2b');
  });

  it('should include theme-aware-paper styles in MuiCssBaseline', () => {
    const mode: PaletteMode = 'light';
    const theme = generateMockTheme(mode);
    const overrides = getComponentOverrides(mode);
    const cssBaselineOverrides = overrides.MuiCssBaseline?.styleOverrides;
    const styles =
      typeof cssBaselineOverrides === 'function'
        ? cssBaselineOverrides(theme)
        : cssBaselineOverrides;
    // @ts-expect-error Property '[".theme-aware-paper"]' comes from an index signature, so it must be accessed with ['.theme-aware-paper'].
    expect(styles['.theme-aware-paper']).toEqual({
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
    });
  });
});
