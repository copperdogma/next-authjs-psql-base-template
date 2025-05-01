import { jest } from '@jest/globals';

// Export mock functions ONLY for functions actually exported by the original module
export const validateSignInInputs = jest.fn();
export const findOrCreateUserAndAccountInternal = jest.fn();
export const prepareProfileDataForDb = jest.fn();

// DO NOT mock internal functions like _buildAuthUserInternalFromCredentials here
// They need to be spied on in the test file itself.

// Add mocks for any other functions exported from the original auth-helpers.ts if needed
