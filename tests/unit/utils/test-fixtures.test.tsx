import React from 'react';
import { screen } from '@testing-library/react';
import { AuthTestUtils, AuthStateFixtures, createMockUser } from '@/tests/utils/test-fixtures';

// Mock component to render
const TestComponent = () => <div>Test Component</div>;

describe('AuthTestUtils Deprecated Functions', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console.warn to check for deprecation messages
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('renderWithAuth should call renderWithSession and show a warning', () => {
    const renderWithSessionSpy = jest.spyOn(AuthTestUtils, 'renderWithSession');
    AuthTestUtils.renderWithAuth(<TestComponent />);

    expect(renderWithSessionSpy).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'renderWithAuth is deprecated, use renderWithSession instead'
    );
    expect(screen.getByText('Test Component')).toBeInTheDocument();

    renderWithSessionSpy.mockRestore();
  });

  it('renderLoading should call renderWithSession and show a warning', () => {
    const renderWithSessionSpy = jest.spyOn(AuthTestUtils, 'renderWithSession');
    AuthTestUtils.renderLoading(<TestComponent />);

    expect(renderWithSessionSpy).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'renderLoading is deprecated with NextAuth - use renderWithSession and mock useSession hook'
    );
    expect(screen.getByText('Test Component')).toBeInTheDocument();

    renderWithSessionSpy.mockRestore();
  });

  it('renderWithError should call renderWithSession and show a warning', () => {
    const renderWithSessionSpy = jest.spyOn(AuthTestUtils, 'renderWithSession');
    AuthTestUtils.renderWithError(<TestComponent />);

    expect(renderWithSessionSpy).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'renderWithError is deprecated with NextAuth - use jest.mock to mock next-auth/react instead'
    );
    expect(screen.getByText('Test Component')).toBeInTheDocument();

    renderWithSessionSpy.mockRestore();
  });
});

describe('createMockUser', () => {
  it('should create a mock user with default values', () => {
    const user = createMockUser();
    expect(user.email).toBe('test@example.com');
  });

  it('should create a mock user with overridden values', () => {
    const user = createMockUser({ displayName: 'Override' });
    expect(user.displayName).toBe('Override');
  });

  it('should call toJSON', () => {
    const user = createMockUser();
    expect(user.toJSON()).toEqual({});
  });
});

describe('AuthStateFixtures', () => {
  it('notAuthenticated should have correct structure', () => {
    expect(AuthStateFixtures.notAuthenticated).toEqual({
      user: null,
      loading: false,
      isClientSide: true,
      error: null,
    });
  });

  it('authenticated should create a mock user', () => {
    const authState = AuthStateFixtures.authenticated({ displayName: 'Authenticated User' });
    expect(authState.user?.displayName).toBe('Authenticated User');
    expect(authState.loading).toBe(false);
    expect(authState.error).toBeNull();
  });

  it('loading should have correct structure', () => {
    expect(AuthStateFixtures.loading).toEqual({
      user: null,
      loading: true,
      isClientSide: true,
      error: null,
    });
  });

  it('error should create an error state', () => {
    const errorState = AuthStateFixtures.error('Custom error message');
    expect(errorState.error).toBe('Custom error message');
    expect(errorState.user).toBeNull();
    expect(errorState.loading).toBe(false);
  });
});
