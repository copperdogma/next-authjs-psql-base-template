/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import { DefaultFirebaseAdminService } from '../../../../lib/services/firebase-admin-service';

// Create mock auth instance
const mockAuthInstance = {
  getUserByEmail: jest.fn(),
  updateUser: jest.fn(),
  createCustomToken: jest.fn(),
};

// Mock logger for debugging
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// We're already auto-mocking the module, but the test is failing because of how
// Jest hoists mocks. Let's keep it very simple and just test the behavior.
describe('DefaultFirebaseAdminService', () => {
  let service: DefaultFirebaseAdminService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DefaultFirebaseAdminService(mockLogger);
  });

  describe('auth', () => {
    it('should call auth method and return the auth instance', () => {
      // Given a mock auth response is set up
      // Set up service's internal admin.auth to return our mock
      // @ts-ignore accessing private property for testing
      service.firebaseAdmin = { auth: jest.fn().mockReturnValue(mockAuthInstance) };

      // When the auth method is called
      const result = service.auth();

      // Then auth should be called and the auth instance returned
      // @ts-ignore accessing private property for testing
      expect(service.firebaseAdmin.auth).toHaveBeenCalled();
      expect(result).toBe(mockAuthInstance);
    });
  });

  describe('getUserByEmail', () => {
    it('should call getUserByEmail on auth instance', async () => {
      // Given
      const mockUserData = { uid: 'testuid', email: 'test@example.com' };
      mockAuthInstance.getUserByEmail.mockResolvedValue(mockUserData);
      // @ts-ignore accessing private property for testing
      service.firebaseAdmin = { auth: jest.fn().mockReturnValue(mockAuthInstance) };

      // When
      const result = await service.getUserByEmail('test@example.com');

      // Then
      expect(mockAuthInstance.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBe(mockUserData);
    });
  });

  describe('updateUser', () => {
    it('should call updateUser on auth instance', async () => {
      // Given
      const mockUserData = { uid: 'testuid', email: 'test@example.com' };
      const updateData = { displayName: 'Test User' };
      mockAuthInstance.updateUser.mockResolvedValue(mockUserData);
      // @ts-ignore accessing private property for testing
      service.firebaseAdmin = { auth: jest.fn().mockReturnValue(mockAuthInstance) };

      // When
      const result = await service.updateUser('testuid', updateData);

      // Then
      expect(mockAuthInstance.updateUser).toHaveBeenCalledWith('testuid', updateData);
      expect(result).toBe(mockUserData);
    });
  });

  describe('createCustomToken', () => {
    it('should call createCustomToken on auth instance', async () => {
      // Given
      const mockToken = 'mock-custom-token';
      mockAuthInstance.createCustomToken.mockResolvedValue(mockToken);
      // @ts-ignore accessing private property for testing
      service.firebaseAdmin = { auth: jest.fn().mockReturnValue(mockAuthInstance) };

      // When
      const result = await service.createCustomToken('testuid', { role: 'admin' });

      // Then
      expect(mockAuthInstance.createCustomToken).toHaveBeenCalledWith('testuid', { role: 'admin' });
      expect(result).toBe(mockToken);
    });
  });
});
