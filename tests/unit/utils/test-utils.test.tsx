import React from 'react';
import { screen } from '@testing-library/dom';
import { renderWithProviders, renderWithAuth, renderWithSession } from '@/tests/utils/test-utils';
import { SessionFixtures } from '@/tests/utils/test-fixtures';

const TestComponent = () => <div>Test Component</div>;

describe('Test Utils', () => {
  it('renderWithProviders should render with a custom container', () => {
    const customContainer = document.createElement('div');
    customContainer.id = 'custom-container';
    document.body.appendChild(customContainer);

    renderWithProviders(<TestComponent />, null, { container: customContainer });

    expect(customContainer).toContainElement(screen.getByText('Test Component'));
  });

  it('renderWithProviders should render with a null session (unauthenticated)', () => {
    renderWithProviders(<TestComponent />, null);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('renderWithProviders should return userEvent setup', () => {
    const { user } = renderWithProviders(<TestComponent />);
    expect(user).toBeDefined();
    // A simple check to ensure it's a userEvent instance
    if (user && 'keyboard' in user) {
      expect(typeof user.click).toBe('function');
    } else {
      fail('A valid userEvent setup was not returned from renderWithProviders');
    }
  });

  it('renderWithProviders should render with a session', () => {
    const session = SessionFixtures.authenticated();
    renderWithProviders(<TestComponent />, session);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('renderWithProviders should pass options to render', () => {
    const { container } = renderWithProviders(<TestComponent />, null, {
      baseElement: document.body,
    });
    expect(container).toBeInTheDocument();
  });

  it('renderWithAuth should render an authenticated component', () => {
    renderWithAuth(<TestComponent />, { displayName: 'Test User' });
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('renderWithSession should render a component', () => {
    renderWithSession(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});
