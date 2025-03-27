import { createMockUser, AuthStateFixtures, AuthTestUtils } from '../../utils/test-fixtures';
import { TEST_USER } from '../../utils/test-constants';
import { screen } from '@testing-library/react';
import { User } from '@firebase/auth';

describe('Test Fixtures', () => {
  describe('createMockUser', () => {
    it('creates a default mock user', () => {
      const user = createMockUser();
      expect(user.uid).toBe(TEST_USER.ID);
      expect(user.email).toBe(TEST_USER.EMAIL);
      expect(user.displayName).toBe(TEST_USER.NAME);
      expect(user.photoURL).toBe(TEST_USER.PHOTO_URL);
    });

    it('allows overriding user properties', () => {
      const overrides = {
        uid: 'custom-id',
        email: 'custom@example.com',
        displayName: 'Custom Name',
        photoURL: 'custom-photo.jpg'
      };
      const user = createMockUser(overrides);
      expect(user.uid).toBe(overrides.uid);
      expect(user.email).toBe(overrides.email);
      expect(user.displayName).toBe(overrides.displayName);
      expect(user.photoURL).toBe(overrides.photoURL);
    });

    it('mocks user methods correctly', async () => {
      const user = createMockUser();
      await expect(user.delete()).resolves.toBeUndefined();
      await expect(user.getIdToken()).resolves.toBe('mock-id-token');
      await expect(user.reload()).resolves.toBeUndefined();
      expect(user.toJSON()).toEqual({});
    });

    it('provides valid token result', async () => {
      const user = createMockUser();
      const tokenResult = await user.getIdTokenResult();
      expect(tokenResult.token).toBe('mock-id-token');
      expect(tokenResult.claims).toEqual({});
      expect(tokenResult.signInProvider).toBe('google.com');
      expect(tokenResult.signInSecondFactor).toBeNull();
      expect(new Date(tokenResult.expirationTime).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('AuthStateFixtures', () => {
    it('provides not authenticated state', () => {
      const state = AuthStateFixtures.notAuthenticated;
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.isClientSide).toBe(true);
    });

    it('provides authenticated state with default user', () => {
      const state = AuthStateFixtures.authenticated();
      expect(state.user).toBeTruthy();
      expect(state.loading).toBe(false);
      expect(state.isClientSide).toBe(true);
    });

    it('provides authenticated state with custom user', () => {
      const customUser = { uid: 'custom-id' } as Partial<User>;
      const state = AuthStateFixtures.authenticated(customUser);
      expect(state.user?.uid).toBe('custom-id');
    });

    it('provides loading state', () => {
      const state = AuthStateFixtures.loading;
      expect(state.user).toBeNull();
      expect(state.loading).toBe(true);
      expect(state.isClientSide).toBe(true);
    });

    it('provides error state with default message', () => {
      const state = AuthStateFixtures.error();
      expect(state.user).toBeNull();
      expect(state.error?.message).toBe('Authentication error');
      expect(state.loading).toBe(false);
    });

    it('provides error state with custom message', () => {
      const customError = 'Custom error message';
      const state = AuthStateFixtures.error(customError);
      expect(state.error?.message).toBe(customError);
    });
  });

  describe('AuthTestUtils', () => {
    const TestComponent = () => <div>Test Component</div>;

    it('renders with default auth state', () => {
      const result = AuthTestUtils.renderWithAuth(<TestComponent />);
      expect(result.user).toBeDefined();
      expect(result.mockSignIn).toBeDefined();
      expect(result.mockSignOut).toBeDefined();
    });

    it('renders with authenticated state', () => {
      const result = AuthTestUtils.renderAuthenticated(<TestComponent />);
      expect(result.user).toBeDefined();
      expect(result.container).toHaveTextContent('Test Component');
    });

    it('renders with custom user properties', () => {
      const customUser = { displayName: 'Custom User' } as Partial<User>;
      const result = AuthTestUtils.renderAuthenticated(<TestComponent />, customUser);
      expect(result.container).toHaveTextContent('Test Component');
    });

    it('renders in loading state', () => {
      const result = AuthTestUtils.renderLoading(<TestComponent />);
      expect(result.container).toHaveTextContent('Test Component');
    });

    it('renders with error state', () => {
      const result = AuthTestUtils.renderWithError(<TestComponent />);
      expect(result.container).toHaveTextContent('Test Component');
    });

    it('renders with custom error message', () => {
      const customError = 'Custom error';
      const result = AuthTestUtils.renderWithError(<TestComponent />, customError);
      expect(result.container).toHaveTextContent('Test Component');
    });
  });
}); 