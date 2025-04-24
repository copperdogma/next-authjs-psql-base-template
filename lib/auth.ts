// ============================================================================
// NextAuth Main Configuration
// ============================================================================

// Main NextAuth import - This SHOULD contain augmented types via next-auth.d.ts
import NextAuth from 'next-auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Import the Node.js-compatible configuration
import { authConfigNode } from './auth-node';

// Generate a correlation ID for this initialization
const correlationId = uuidv4();

logger.info({
  msg: 'Initializing NextAuth',
  correlationId,
  env: process.env.NODE_ENV,
  component: 'auth'
});

// Initialize NextAuth with the configuration
const { handlers, auth, signIn, signOut } = NextAuth(authConfigNode);

logger.info({
  msg: 'NextAuth initialized successfully',
  correlationId,
  env: process.env.NODE_ENV,
  component: 'auth'
});

// Export the handlers and the auth function
export { handlers, auth, signIn, signOut }; 