import { AuthStateFixtures, createMockUser } from '@/tests/utils/test-fixtures';

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
