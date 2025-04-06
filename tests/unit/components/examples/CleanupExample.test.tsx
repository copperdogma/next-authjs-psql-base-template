import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CleanupExample } from '../../../../components/examples/CleanupExample';

describe('CleanupExample', () => {
  it('renders with the initial count', () => {
    render(<CleanupExample initialCount={5} />);
    expect(screen.getByText('Counter: 5')).toBeInTheDocument();
  });

  it('uses default initialCount value when provided as undefined', () => {
    // This tests the default parameter value in the component destructuring
    render(<CleanupExample initialCount={undefined as unknown as number} />);
    expect(screen.getByText('Counter: 0')).toBeInTheDocument();
  });

  it('increments count when button is clicked', () => {
    render(<CleanupExample initialCount={0} />);
    const button = screen.getByText('Increment');

    fireEvent.click(button);
    expect(screen.getByText('Counter: 1')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText('Counter: 2')).toBeInTheDocument();
  });

  it('calls onMount callback when component mounts', () => {
    const onMountMock = jest.fn();
    render(<CleanupExample initialCount={0} onMount={onMountMock} />);

    expect(onMountMock).toHaveBeenCalledTimes(1);
  });

  it('does not throw error when onMount is not provided', () => {
    // This tests the conditional branch where onMount is undefined
    expect(() => {
      render(<CleanupExample initialCount={0} />);
    }).not.toThrow();
  });

  it('calls onUnmount callback when component unmounts', () => {
    const onUnmountMock = jest.fn();
    const { unmount } = render(<CleanupExample initialCount={0} onUnmount={onUnmountMock} />);

    unmount();
    expect(onUnmountMock).toHaveBeenCalledTimes(1);
  });

  it('does not throw error when onUnmount is not provided', () => {
    // This tests the conditional branch where onUnmount is undefined
    const { unmount } = render(<CleanupExample initialCount={0} />);

    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('handles both mount and unmount callbacks together', () => {
    const onMountMock = jest.fn();
    const onUnmountMock = jest.fn();

    const { unmount } = render(
      <CleanupExample initialCount={0} onMount={onMountMock} onUnmount={onUnmountMock} />
    );

    expect(onMountMock).toHaveBeenCalledTimes(1);
    unmount();
    expect(onUnmountMock).toHaveBeenCalledTimes(1);
  });
});
