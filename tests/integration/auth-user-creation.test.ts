import { describe, expect, it } from '@jest/globals';
import { createMockUser } from '../utils/test-fixtures';

describe('Auth User Creation', () => {
  it('should create a mock user with default values', () => {
    const mockUser = createMockUser();
    expect(mockUser).toBeDefined();
    expect(mockUser.uid).toBe('test-uid');
    expect(mockUser.email).toBe('test@example.com');
  });

  it('should create a mock user with overridden values', () => {
    const mockUser = createMockUser({
      uid: 'custom-uid',
      email: 'custom@example.com',
    });
    expect(mockUser.uid).toBe('custom-uid');
    expect(mockUser.email).toBe('custom@example.com');
  });
});
