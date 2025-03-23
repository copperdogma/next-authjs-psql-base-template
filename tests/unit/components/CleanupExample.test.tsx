import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, useEffect } from 'react';

// A simple component that demonstrates side effects that need cleanup
const ExampleComponent = ({ onMount }: { onMount?: () => void }) => {
  const [count, setCount] = useState(0);

  // This effect needs proper cleanup
  useEffect(() => {
    // Set up an interval that updates the count
    const intervalId = setInterval(() => {
      setCount(prev => prev + 1);
    }, 1000);

    // Notify parent about mounting (for testing)
    if (onMount) onMount();

    // This cleanup function prevents memory leaks
    return () => {
      clearInterval(intervalId);
    };
  }, [onMount]);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(prev => prev + 1)}>Increment</button>
    </div>
  );
};

describe('Component with Proper Cleanup', () => {
  // Run cleanup after each test automatically
  afterEach(() => {
    cleanup(); // This ensures React components are unmounted
    jest.clearAllMocks();
  });

  it('should render the component with initial count', () => {
    // Arrange
    render(<ExampleComponent />);

    // Act - nothing to do for initial render

    // Assert
    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent('Counter: 0');
  });

  it('should increment count when button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ExampleComponent />);

    // Act
    const button = screen.getByRole('button', { name: /increment/i });
    await user.click(button);

    // Assert
    expect(screen.getByRole('heading')).toHaveTextContent('Counter: 1');
  });

  it('should call onMount when component mounts', () => {
    // Arrange
    const mockOnMount = jest.fn();

    // Act
    render(<ExampleComponent onMount={mockOnMount} />);

    // Assert
    expect(mockOnMount).toHaveBeenCalledTimes(1);
  });

  it('demonstrates test isolation by not affecting other tests', () => {
    // Arrange
    render(<ExampleComponent />);

    // Assert
    // This would fail if cleanup wasn't working properly from previous tests
    expect(screen.getByRole('heading')).toHaveTextContent('Counter: 0');
  });
});
