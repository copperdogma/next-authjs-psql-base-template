import React, { useEffect, useState } from 'react';

interface CleanupExampleProps {
  initialCount: number;
  onMount?: () => void;
  onUnmount?: () => void;
}

/**
 * Example component demonstrating proper useEffect cleanup
 */
export const CleanupExample: React.FC<CleanupExampleProps> = ({
  initialCount = 0,
  onMount,
  onUnmount,
}) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    // Call the onMount callback when the component mounts
    if (onMount) {
      onMount();
    }

    // Return a cleanup function that will be called when the component unmounts
    return () => {
      if (onUnmount) {
        onUnmount();
      }
    };
  }, [onMount, onUnmount]);

  const handleIncrement = () => {
    setCount(prevCount => prevCount + 1);
  };

  return (
    <div className="p-4 border rounded shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Counter: {count}</h2>
      <button
        onClick={handleIncrement}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Increment
      </button>
    </div>
  );
};
