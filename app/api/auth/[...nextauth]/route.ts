// Import handlers from the v5 NODE config
import { handlers } from '@/lib/auth-node'; // Reverted to auth-node

// Export the handlers for GET and POST requests
export const { GET, POST } = handlers;

// Remove edge runtime specification
// export const runtime = 'edge';
