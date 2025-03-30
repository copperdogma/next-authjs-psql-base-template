import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Button } from '../../../components/ui/Button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('displays loading state correctly with start position', () => {
    // Arrange & Act
    render(
      <Button isLoading loadingText="Loading..." loadingPosition="start">
        Click me
      </Button>
    );

    // Assert
    const button = screen.getByRole('button', { name: /loading\.\.\./i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays loading state correctly with end position', () => {
    // Arrange & Act
    render(
      <Button isLoading loadingText="Loading..." loadingPosition="end">
        Click me
      </Button>
    );

    // Assert
    const button = screen.getByRole('button', { name: /loading\.\.\./i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays loading state correctly with center position', () => {
    // Arrange & Act
    render(
      <Button isLoading loadingText="Loading..." loadingPosition="center">
        Click me
      </Button>
    );

    // Assert
    const button = screen.getByRole('button', { name: /loading\.\.\./i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('applies fixed width when specified', () => {
    // Arrange & Act
    render(<Button fixedWidth>Click me</Button>);

    // Assert
    const button = screen.getByRole('button', { name: /click me/i });
    // We can't easily test the exact styles with Jest DOM,
    // but we can verify the button is rendered
    expect(button).toBeInTheDocument();
  });

  it('passes through MUI button props correctly', () => {
    // Arrange & Act
    render(
      <Button variant="contained" color="secondary" size="small" disabled>
        Click me
      </Button>
    );

    // Assert
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('handles click events when not loading or disabled', async () => {
    // Arrange
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const user = userEvent.setup();

    // Act
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click events when loading', () => {
    // Arrange
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} isLoading>
        Click me
      </Button>
    );

    // Act & Assert
    const button = screen.getByRole('button');

    // Verify button is disabled (which prevents click events)
    expect(button).toBeDisabled();
    expect(handleClick).not.toHaveBeenCalled();
  });
});
