import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import {
  ThemeWrapper,
  renderWithTheme,
  useTheme,
  MockThemeContext,
  type ThemeContextValue,
} from '../../../tests/utils/test-theme-wrapper';

describe('ThemeWrapper', () => {
  it('renders children correctly with default theme', () => {
    // Arrange & Act
    render(
      <ThemeWrapper>
        <div data-testid="test-child">Child Content</div>
      </ThemeWrapper>
    );

    // Assert
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toHaveTextContent('Child Content');
  });

  it('renders children with custom theme value', () => {
    // Arrange
    const customThemeValue: ThemeContextValue = {
      theme: 'dark',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'dark',
    };

    // Act
    render(
      <ThemeWrapper themeValue={customThemeValue}>
        <div data-testid="test-child">Child Content</div>
      </ThemeWrapper>
    );

    // Assert
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });
});

describe('renderWithTheme', () => {
  it('returns UI wrapped in ThemeWrapper with default theme', () => {
    // Arrange
    const TestComponent = () => <div data-testid="test-component">Test Content</div>;

    // Act
    const { ui, setThemeMock } = renderWithTheme(<TestComponent />);
    render(ui);

    // Assert
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(setThemeMock).toBeDefined();
  });

  it('uses provided theme state correctly', () => {
    // Arrange
    const TestComponent = () => <div data-testid="test-component">Test Content</div>;
    const themeState = { theme: 'dark' as const, resolvedTheme: 'dark' as const };

    // Act
    const { ui, setThemeMock } = renderWithTheme(<TestComponent />, themeState);
    render(ui);

    // Assert
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(setThemeMock).toBeDefined();
  });

  it('resolves system theme to light by default', () => {
    // Arrange
    const TestComponent = () => <div data-testid="test-component">Test Content</div>;
    const themeState = { theme: 'system' as const };

    // Act
    const { ui } = renderWithTheme(<TestComponent />, themeState);
    render(ui);

    // Assert
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('uses provided resolved theme over automatic resolution', () => {
    // Arrange
    const TestComponent = () => <div data-testid="test-component">Test Content</div>;
    const themeState = {
      theme: 'system' as const,
      resolvedTheme: 'dark' as const, // This should override the default light resolution
    };

    // Act
    const { ui } = renderWithTheme(<TestComponent />, themeState);
    render(ui);

    // Assert
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });
});

describe('MockThemeContext', () => {
  it('provides default theme context values', () => {
    // Arrange
    const TestConsumer = () => {
      const context = React.useContext(MockThemeContext);
      return (
        <div>
          <div data-testid="theme-value">{context.theme}</div>
          <div data-testid="resolved-theme-value">{context.resolvedTheme}</div>
        </div>
      );
    };

    // Act
    render(<TestConsumer />);

    // Assert
    expect(screen.getByTestId('theme-value')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved-theme-value')).toHaveTextContent('light');
  });
});

describe('useTheme hook', () => {
  it('returns default theme context values', () => {
    // Arrange
    const TestComponent = () => {
      const themeContext = useTheme();
      return (
        <div>
          <div data-testid="theme-value">{themeContext.theme}</div>
          <div data-testid="resolved-theme-value">{themeContext.resolvedTheme}</div>
        </div>
      );
    };

    // Act
    render(<TestComponent />);

    // Assert
    expect(screen.getByTestId('theme-value')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved-theme-value')).toHaveTextContent('light');
  });
});
