// Manual mock for ThemeProvider that Jest will automatically use
const mockSetTheme = jest.fn();
const mockTheme = {
  theme: 'system',
  setTheme: mockSetTheme,
  resolvedTheme: 'light',
};

// Export the mock useTheme hook
const useTheme = jest.fn(() => mockTheme);

// Reset the mock between tests
afterEach(() => {
  mockSetTheme.mockClear();
  useTheme.mockClear();

  // Reset default return value
  useTheme.mockImplementation(() => ({
    theme: 'system',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
  }));
});

// Export both the hook and the mocked functions for test manipulation
module.exports = {
  useTheme,
  mockSetTheme,
  mockTheme,
  // For components that might need ThemeProvider
  ThemeProvider: ({ children }) => children,
};
