/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import * as admin from 'firebase-admin';
import * as pino from 'pino';
import { FirebaseAdminService } from '../../../../lib/services/firebase-admin-service';

describe('FirebaseAdminService', () => {
  // Mock auth methods with proper return types
  const mockVerifyIdToken = jest.fn<() => Promise<admin.auth.DecodedIdToken>>();
  const mockGetUser = jest.fn<() => Promise<admin.auth.UserRecord>>();
  const mockGetUserByEmail = jest.fn<() => Promise<admin.auth.UserRecord>>();
  const mockUpdateUser = jest.fn<() => Promise<admin.auth.UserRecord>>();
  const mockCreateCustomToken = jest.fn<() => Promise<string>>();

  // Mock auth object with proper type
  const mockAuth = {
    verifyIdToken: mockVerifyIdToken,
    getUser: mockGetUser,
    getUserByEmail: mockGetUserByEmail,
    updateUser: mockUpdateUser,
    createCustomToken: mockCreateCustomToken,
  } as unknown as admin.auth.Auth;

  // Logger mock that tracks calls
  const mockLogger = {
    debug: jest.fn(),
    trace: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as pino.Logger;

  // Create service with mocks
  let service: FirebaseAdminService;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create test instance with our mocks
    service = FirebaseAdminService.createTestInstance(mockAuth, mockLogger);
  });

  describe('createTestInstance', () => {
    it('should create a service instance with mocked dependencies', () => {
      expect(service).toBeInstanceOf(FirebaseAdminService);
    });

    it('should create a service instance with default logger if not provided', () => {
      const defaultService = FirebaseAdminService.createTestInstance(mockAuth);
      expect(defaultService).toBeInstanceOf(FirebaseAdminService);
    });
  });

  describe('verifyIdToken', () => {
    it('should call the auth.verifyIdToken method with the token', async () => {
      const testToken = 'test-token-123';
      const mockDecodedToken = { uid: 'test-uid' } as admin.auth.DecodedIdToken;
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const result = await service.verifyIdToken(testToken);

      expect(mockVerifyIdToken).toHaveBeenCalledWith(testToken);
      expect(result).toEqual(mockDecodedToken);
      expect(mockLogger.trace).toHaveBeenCalled();
    });
  });

  describe('getUserByUid', () => {
    it('should call the auth.getUser method with the uid', async () => {
      const testUid = 'test-uid-123';
      const mockUserRecord = { uid: testUid, email: 'test@example.com' } as admin.auth.UserRecord;
      mockGetUser.mockResolvedValue(mockUserRecord);

      const result = await service.getUserByUid(testUid);

      expect(mockGetUser).toHaveBeenCalledWith(testUid);
      expect(result).toEqual(mockUserRecord);
      expect(mockLogger.trace).toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    it('should call the auth.getUserByEmail method with the email', async () => {
      const testEmail = 'test@example.com';
      const mockUserRecord = { uid: 'test-uid', email: testEmail } as admin.auth.UserRecord;
      mockGetUserByEmail.mockResolvedValue(mockUserRecord);

      const result = await service.getUserByEmail(testEmail);

      expect(mockGetUserByEmail).toHaveBeenCalledWith(testEmail);
      expect(result).toEqual(mockUserRecord);
      expect(mockLogger.trace).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should call the auth.updateUser method with the uid and data', async () => {
      const testUid = 'test-uid-123';
      const updateData = { displayName: 'New Test Name' };
      const mockUserRecord = {
        uid: testUid,
        displayName: 'New Test Name',
      } as admin.auth.UserRecord;
      mockUpdateUser.mockResolvedValue(mockUserRecord);

      const result = await service.updateUser(testUid, updateData);

      expect(mockUpdateUser).toHaveBeenCalledWith(testUid, updateData);
      expect(result).toEqual(mockUserRecord);
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });

  describe('createCustomToken', () => {
    it('should call the auth.createCustomToken method with the uid and claims', async () => {
      const testUid = 'test-uid-123';
      const claims = { role: 'admin' };
      mockCreateCustomToken.mockResolvedValue('custom-token-123');

      const result = await service.createCustomToken(testUid, claims);

      expect(mockCreateCustomToken).toHaveBeenCalledWith(testUid, claims);
      expect(result).toBe('custom-token-123');
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should call the auth.createCustomToken without claims if not provided', async () => {
      const testUid = 'test-uid-123';
      mockCreateCustomToken.mockResolvedValue('custom-token-123');

      const result = await service.createCustomToken(testUid);

      expect(mockCreateCustomToken).toHaveBeenCalledWith(testUid, undefined);
      expect(result).toBe('custom-token-123');
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });
});
