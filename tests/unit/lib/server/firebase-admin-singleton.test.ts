import { FirebaseAdminService } from '@/lib/services/firebase-admin-service';
import { logger as actualLoggerFromMock } from '@/lib/logger';

// Mock FirebaseAdminService at the top level
jest.mock('@/lib/services/firebase-admin-service');

// Mock logger at the top level
jest.mock('@/lib/logger', () => ({
  logger: {
    child: jest.fn().mockReturnThis(),
    fatal: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockFirebaseAdminApp = { name: 'mockAdminApp' };
const mockFirebaseAdminAppNotInitialized = null;

describe.skip('lib/server/firebase-admin-singleton', () => {
  let MockedFirebaseAdminService: jest.MockedClass<typeof FirebaseAdminService>;
  let mockedLoggerChild: jest.Mock;
  let mockedLoggerFatal: jest.Mock;

  beforeEach(() => {
    jest.resetModules(); // Reset modules before each test to ensure clean state

    // Assign mocked versions after resetModules and before each test
    MockedFirebaseAdminService = FirebaseAdminService as jest.MockedClass<
      typeof FirebaseAdminService
    >;
    mockedLoggerChild = (actualLoggerFromMock as any).child as jest.Mock;
    mockedLoggerFatal = (actualLoggerFromMock as any).fatal as jest.Mock;

    // Clear mocks
    MockedFirebaseAdminService.mockClear();
    mockedLoggerChild.mockClear();
    mockedLoggerFatal.mockClear();
  });

  describe('Singleton Initialization', () => {
    it('should create a FirebaseAdminService instance if firebaseAdminApp is initialized', () => {
      jest.doMock('@/lib/server/firebase-admin-init', () => ({
        firebaseAdminApp: mockFirebaseAdminApp,
      }));
      const {
        firebaseAdminServiceImpl: serviceInstance,
      } = require('@/lib/server/firebase-admin-singleton');

      expect(mockedLoggerChild).toHaveBeenCalledWith({ service: 'FirebaseAdminSingleton' });
      expect(MockedFirebaseAdminService).toHaveBeenCalledTimes(1);
      expect(MockedFirebaseAdminService).toHaveBeenCalledWith(
        mockFirebaseAdminApp,
        expect.any(Object)
      );
      expect(serviceInstance).toBeInstanceOf(MockedFirebaseAdminService);
      expect(mockedLoggerFatal).not.toHaveBeenCalled();
    });

    it('should throw an error if firebaseAdminApp is not initialized', () => {
      jest.doMock('@/lib/server/firebase-admin-init', () => ({
        firebaseAdminApp: mockFirebaseAdminAppNotInitialized,
      }));
      expect(() => {
        require('@/lib/server/firebase-admin-singleton');
      }).toThrow(
        'FirebaseAdminService singleton cannot be created due to Firebase Admin App initialization failure.'
      );

      expect(mockedLoggerChild).toHaveBeenCalledWith({ service: 'FirebaseAdminSingleton' });
      expect(MockedFirebaseAdminService).not.toHaveBeenCalled();
      expect(mockedLoggerFatal).toHaveBeenCalledWith(
        'Firebase Admin App was not initialized. FirebaseAdminService singleton cannot be created.'
      );
    });
  });

  describe('isFirebaseAdminServiceReady', () => {
    it('should return true if service and app are initialized', () => {
      jest.doMock('@/lib/server/firebase-admin-init', () => ({
        firebaseAdminApp: mockFirebaseAdminApp,
      }));
      const {
        isFirebaseAdminServiceReady: isReady,
      } = require('@/lib/server/firebase-admin-singleton');
      expect(isReady()).toBe(true);
    });

    it('should return false if firebaseAdminApp.name is missing (app partially uninitialized)', () => {
      jest.doMock('@/lib/server/firebase-admin-init', () => ({
        firebaseAdminApp: { ...mockFirebaseAdminApp, name: undefined },
      }));
      const {
        isFirebaseAdminServiceReady: isReady,
      } = require('@/lib/server/firebase-admin-singleton');
      expect(isReady()).toBe(false);
    });
  });
});
