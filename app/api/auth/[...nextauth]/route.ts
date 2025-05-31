// Import handlers from the NextAuth.js Node.js configuration
import { handlers } from '@/lib/auth-node';

// Export the handlers for GET and POST requests
export const { GET, POST } = handlers;

// Remove edge runtime specification
// export const runtime = 'edge';
