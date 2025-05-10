import { UserRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Import the mocked functions from auth-helpers mock
import {
  findOrCreateUserAndAccountInternal,
  prepareProfileDataForDb,
  validateSignInInputs,
} from './auth-helpers';

// Export the default dependencies with the mocked functions
export const defaultDependencies = {
  findOrCreateUser: findOrCreateUserAndAccountInternal,
  prepareProfile: prepareProfileDataForDb,
  validateInputs: validateSignInInputs,
  uuidv4,
};

// Export the OAuthDbUser type
export type OAuthDbUser = {
  userId: string;
  userEmail: string;
  name?: string | null | undefined;
  image?: string | null | undefined;
  role?: UserRole | null | undefined;
};
