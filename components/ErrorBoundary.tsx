'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { clientLogger } from '@/lib/client-logger';
import { getDisplayErrorMessage, shouldShowErrorDetails } from '@/lib/utils/error-display';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors in child component tree
 * and display a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    clientLogger.error('Error caught by ErrorBoundary', { error, errorInfo });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const displayMessage = getDisplayErrorMessage(
        this.state.error,
        'The application encountered an unexpected error.'
      );
      const showDetails = shouldShowErrorDetails();

      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-red-700 mb-4">{displayMessage}</p>
          {showDetails && this.state.error && (
            <details className="text-xs text-gray-700 bg-white p-2 rounded border">
              <summary>Error details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error?.toString()}</pre>
            </details>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
