// Manual mock for next-themes that Jest will automatically use
const mockSetTheme = jest.fn();
const mockTheme = {
  theme: 'system',
  setTheme: mockSetTheme,
  resolvedTheme: 'light',
  themes: ['light', 'dark', 'system'],
  systemTheme: 'light',
};

// Export the mock useTheme hook
const useTheme = jest.fn(() => mockTheme);

// Export ThemeProvider component
const ThemeProvider = ({ children }) => children;

// Reset the mock between tests
afterEach(() => {
  mockSetTheme.mockClear();
  useTheme.mockClear();

  // Reset default return value
  useTheme.mockImplementation(() => ({
    theme: 'system',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
    themes: ['light', 'dark', 'system'],
    systemTheme: 'light',
  }));
});

module.exports = {
  useTheme,
  ThemeProvider,
};
