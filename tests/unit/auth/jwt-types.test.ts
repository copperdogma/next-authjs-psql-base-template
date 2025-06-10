/**
 * Tests for JWT type definitions to ensure proper type safety
 * Verifies that JWT interface includes custom id and role properties
 */

import type { JWT } from 'next-auth/jwt';
import { UserRole } from '@/types';

describe('JWT Type Definitions', () => {
  describe('JWT Interface Extensions', () => {
    it('should allow JWT to have id property of type string', () => {
      const mockJWT: JWT = {
        id: 'user-123',
        role: UserRole.USER,
        email: 'test@example.com',
        name: 'Test User',
      };

      expect(mockJWT.id).toBe('user-123');
      expect(typeof mockJWT.id).toBe('string');
    });

    it('should allow JWT to have role property of type UserRole', () => {
      const mockJWT: JWT = {
        id: 'user-123',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
        name: 'Admin User',
      };

      expect(mockJWT.role).toBe(UserRole.ADMIN);
      expect(Object.values(UserRole)).toContain(mockJWT.role);
    });

    it('should enforce required id and role properties on JWT', () => {
      // This test ensures TypeScript compilation will fail if id or role are missing
      // The test itself validates that we can create a valid JWT with all required properties
      const createJWT = (): JWT => ({
        id: 'test-user-id',
        role: UserRole.USER,
        email: 'test@example.com',
      });

      const jwt = createJWT();
      expect(jwt).toHaveProperty('id');
      expect(jwt).toHaveProperty('role');
      expect(typeof jwt.id).toBe('string');
      expect(Object.values(UserRole)).toContain(jwt.role);
    });

    it('should support all UserRole enum values', () => {
      const userJWT: JWT = {
        id: 'user-1',
        role: UserRole.USER,
        email: 'user@example.com',
      };

      const adminJWT: JWT = {
        id: 'admin-1',
        role: UserRole.ADMIN,
        email: 'admin@example.com',
      };

      expect(userJWT.role).toBe(UserRole.USER);
      expect(adminJWT.role).toBe(UserRole.ADMIN);
    });
  });

  describe('JWT Type Safety in Callbacks', () => {
    it('should provide type-safe access to custom properties in jwt callback context', () => {
      // Simulate the structure that would be used in a jwt callback
      const mockJwtCallback = (token: JWT, user?: { id: string; role: UserRole }) => {
        if (user) {
          token.id = user.id;
          token.role = user.role;
        }
        return token;
      };

      const user = { id: 'user-123', role: UserRole.USER };
      const initialToken: JWT = { email: 'test@example.com' } as JWT;

      const updatedToken = mockJwtCallback(initialToken, user);

      expect(updatedToken.id).toBe('user-123');
      expect(updatedToken.role).toBe(UserRole.USER);
    });
  });
});
