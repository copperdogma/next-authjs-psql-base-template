// Remove v4 imports and handler creation

// Import handlers from the v5 config
import { handlers } from '@/lib/auth';

// Export the handlers for GET and POST requests
export const { GET, POST } = handlers;

// Optional: Specify runtime if needed (e.g., \'edge\')
// export const runtime = \"edge\";
