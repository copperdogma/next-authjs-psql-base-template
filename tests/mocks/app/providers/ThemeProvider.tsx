// Mock implementation for ThemeProvider
import { ReactNode } from 'react';

export const useTheme = jest.fn().mockReturnValue({
  theme: 'system',
  setTheme: jest.fn(),
  resolvedTheme: 'light',
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  return children;
}
