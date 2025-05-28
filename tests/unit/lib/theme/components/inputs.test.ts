import { getButtonOverrides, getFormComponentOverrides } from '@/lib/theme/components/inputs';
import { PALETTE } from '@/lib/theme/palette';
import { createTheme, Theme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Helper to create a partial mock theme for testing
const createMockTheme = (mode: PaletteMode): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? PALETTE.light.primary.main : PALETTE.dark.primary.main,
      },
      text: {
        primary: mode === 'light' ? PALETTE.light.text.primary : PALETTE.dark.text.primary,
      },
      // Add other palette properties if needed by the components being tested
    },
    shadows: ['none', '0px 1px 3px rgba(0,0,0,0.12)', '0px 1px 8px rgba(0,0,0,0.12)'] as any,
  });
};

describe('Input Component Overrides', () => {
  describe('getButtonOverrides', () => {
    it('should return correct focus-visible outlineColor for light mode', () => {
      const mode: PaletteMode = 'light';
      const overrides = getButtonOverrides(mode);
      const sizeMediumStyle = overrides.styleOverrides?.sizeMedium as any;
      expect(sizeMediumStyle?.['&:focus-visible']?.outlineColor).toBe(PALETTE.light.primary.main);
    });

    it('should return correct focus-visible outlineColor for dark mode', () => {
      const mode: PaletteMode = 'dark';
      const overrides = getButtonOverrides(mode);
      const sizeMediumStyle = overrides.styleOverrides?.sizeMedium as any;
      expect(sizeMediumStyle?.['&:focus-visible']?.outlineColor).toBe(PALETTE.dark.primary.main);
    });

    it('should include root styles', () => {
      const overrides = getButtonOverrides('light');
      expect(overrides.styleOverrides?.root).toEqual({
        borderRadius: 8,
        padding: '8px 16px',
        transition: 'all 0.2s',
        fontWeight: 500,
      });
    });

    it('should include contained styles with theme', () => {
      const theme = createMockTheme('light');
      const overrides = getButtonOverrides('light');
      const containedStyles = overrides.styleOverrides?.contained as any;
      const styles = containedStyles({ theme });
      expect(styles.boxShadow).toBe(theme.shadows[1]);
      expect(styles['&:hover'].boxShadow).toBe(theme.shadows[2]);
    });

    it('should include outlined styles', () => {
      const overrides = getButtonOverrides('light');
      expect(overrides.styleOverrides?.outlined).toEqual({
        borderWidth: 1.5,
        '&:hover': {
          borderWidth: 1.5,
        },
      });
    });
  });

  describe('getFormComponentOverrides', () => {
    it('should return correct MuiInputBase backgroundColor and color for light mode', () => {
      const mode: PaletteMode = 'light';
      const overrides = getFormComponentOverrides(mode);
      const rootStyle = overrides.MuiInputBase?.styleOverrides?.root as any;
      expect(rootStyle?.backgroundColor).toBe('rgba(0, 0, 0, 0.02)');
      expect(rootStyle?.color).toBe(PALETTE.light.text.primary);
    });

    it('should return correct MuiInputBase backgroundColor and color for dark mode', () => {
      const mode: PaletteMode = 'dark';
      const overrides = getFormComponentOverrides(mode);
      const rootStyle = overrides.MuiInputBase?.styleOverrides?.root as any;
      expect(rootStyle?.backgroundColor).toBe('rgba(255, 255, 255, 0.05)');
      expect(rootStyle?.color).toBe(PALETTE.dark.text.primary);
    });

    it('should include MuiFormLabel styles', () => {
      const overrides = getFormComponentOverrides('light');
      expect(overrides.MuiFormLabel?.styleOverrides?.root).toEqual({
        marginBottom: 4,
      });
    });

    it('should include MuiOutlinedInput styles', () => {
      const overrides = getFormComponentOverrides('light');
      expect(overrides.MuiOutlinedInput?.styleOverrides?.root).toEqual({
        borderRadius: 8,
      });
    });

    it('should include MuiButtonBase styles', () => {
      const overrides = getFormComponentOverrides('light');
      expect(overrides.MuiButtonBase?.styleOverrides?.root).toEqual({
        borderRadius: 8,
      });
    });
  });
});
