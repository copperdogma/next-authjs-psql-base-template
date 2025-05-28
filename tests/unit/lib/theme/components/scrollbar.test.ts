import { getScrollbarStyles } from '@/lib/theme/components/scrollbar';
import { PaletteMode } from '@mui/material';

describe('getScrollbarStyles', () => {
  it('should return correct scrollbar styles for light mode', () => {
    const mode: PaletteMode = 'light';
    const styles = getScrollbarStyles(mode);

    expect(styles.body.scrollbarColor).toBe('#959595 #f5f5f5');
    expect(styles.body['&::-webkit-scrollbar, & *::-webkit-scrollbar']).toEqual({
      width: 8,
      height: 8,
      backgroundColor: '#f5f5f5',
    });
    expect(styles.body['&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb']).toEqual({
      borderRadius: 8,
      backgroundColor: '#959595',
      minHeight: 24,
    });
    expect(
      styles.body['&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus']
    ).toEqual({
      backgroundColor: '#bdbdbd',
    });
    expect(
      styles.body['&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active']
    ).toEqual({
      backgroundColor: '#bdbdbd',
    });
    expect(
      styles.body['&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover']
    ).toEqual({
      backgroundColor: '#bdbdbd',
    });
  });

  it('should return correct scrollbar styles for dark mode', () => {
    const mode: PaletteMode = 'dark';
    const styles = getScrollbarStyles(mode);

    expect(styles.body.scrollbarColor).toBe('#6b6b6b #2b2b2b');
    expect(styles.body['&::-webkit-scrollbar, & *::-webkit-scrollbar']).toEqual({
      width: 8,
      height: 8,
      backgroundColor: '#2b2b2b',
    });
    expect(styles.body['&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb']).toEqual({
      borderRadius: 8,
      backgroundColor: '#6b6b6b',
      minHeight: 24,
    });
    expect(
      styles.body['&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus']
    ).toEqual({
      backgroundColor: '#818181',
    });
    expect(
      styles.body['&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active']
    ).toEqual({
      backgroundColor: '#818181',
    });
    expect(
      styles.body['&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover']
    ).toEqual({
      backgroundColor: '#818181',
    });
  });
});
