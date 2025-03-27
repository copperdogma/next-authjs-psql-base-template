import React from 'react';
import { render, RenderResult } from '@testing-library/react';

/**
 * Helper function for testing server components
 *
 * Note: This is a simplified testing utility that treats server components
 * as if they were client components for testing purposes only.
 *
 * For complete server component testing, E2E tests are recommended as
 * Jest has limited support for async Server Components.
 *
 * @param Component - The server component to test
 * @param props - Props to pass to the component
 */
export async function renderServerComponent<P extends object>(
  Component: React.ComponentType<P>,
  props?: P
): Promise<{
  html: string;
  container: HTMLElement;
  getByText: (text: string) => Element | null;
  queryBySelector: (selector: string) => Element | null;
  queryAllBySelector: (selector: string) => Element[];
}> {
  // For testing purposes, we'll render the component as if it were a client component
  const renderResult: RenderResult = render(<Component {...(props || ({} as P))} />);

  // Get the HTML content
  const html = renderResult.container.innerHTML;

  return {
    // Return the rendered HTML
    html: html || '',
    // Return the container element
    container: renderResult.container,
    // Query helpers
    getByText: (text: string): Element | null => {
      if (!text) return null;

      try {
        return renderResult.getByText(text);
      } catch {
        return null;
      }
    },
    queryBySelector: (selector: string): Element | null => {
      return selector ? renderResult.container.querySelector(selector) : null;
    },
    queryAllBySelector: (selector: string): Element[] => {
      return selector ? Array.from(renderResult.container.querySelectorAll(selector)) : [];
    },
  };
}
