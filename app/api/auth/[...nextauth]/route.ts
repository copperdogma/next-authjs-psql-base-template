// Remove v4 imports and handler creation

// Import handlers from the v5 config using the alias to the new location
import { handlers } from '@/lib/auth-node';

// Export the handlers for GET and POST requests
export const { GET, POST } = handlers;

// Optional: Specify runtime if needed (e.g., \'edge\')
// export const runtime = \"edge\";
