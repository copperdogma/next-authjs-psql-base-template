import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_API_KEY is required',
  }),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required',
  }),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID is required',
  }),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required',
  }),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is required',
  }),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string({
    required_error: 'NEXT_PUBLIC_FIREBASE_APP_ID is required',
  }),

  // Firebase Admin SDK
  FIREBASE_PROJECT_ID: z.string({
    required_error: 'FIREBASE_PROJECT_ID is required',
  }),
  FIREBASE_CLIENT_EMAIL: z.string({
    required_error: 'FIREBASE_CLIENT_EMAIL is required',
  }),
  FIREBASE_PRIVATE_KEY: z.string({
    required_error: 'FIREBASE_PRIVATE_KEY is required',
  }),

  // Database
  POSTGRES_URL: z.string({
    required_error: 'POSTGRES_URL is required',
  }),
  REDIS_URL: z.string({
    required_error: 'REDIS_URL is required',
  }),
  DATABASE_URL: z.string({
    required_error: 'DATABASE_URL is required',
  }),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string({
    required_error: 'GOOGLE_CLIENT_ID is required',
  }),
  GOOGLE_CLIENT_SECRET: z.string({
    required_error: 'GOOGLE_CLIENT_SECRET is required',
  }),

  // // PWA - Removed as manifest is now statically defined
  // NEXT_PUBLIC_PWA_APP_NAME: z.string().optional(),
  // NEXT_PUBLIC_PWA_APP_SHORT_NAME: z.string().optional(),
  // NEXT_PUBLIC_PWA_APP_DESCRIPTION: z.string({
  //   required_error: 'NEXT_PUBLIC_PWA_APP_DESCRIPTION is required',
  // }),
});

// Export the type inferred from the schema
export type Env = z.infer<typeof envSchema>;

// Export required environment variables for utility functions
export const requiredEnvVars = [
  // Firebase
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',

  // Firebase Admin SDK
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',

  // Database
  'POSTGRES_URL',
  'REDIS_URL',
  'DATABASE_URL',

  // Google OAuth
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',

  // // PWA - Removed
  // 'NEXT_PUBLIC_PWA_APP_NAME',
  // 'NEXT_PUBLIC_PWA_APP_SHORT_NAME',
  // 'NEXT_PUBLIC_PWA_APP_DESCRIPTION',
] as const;

// Define union type for NODE_ENV
export type NodeEnv = 'development' | 'production' | 'test';

// Format Zod validation errors into a more readable format
function formatZodError(error: z.ZodError) {
  return error.errors
    .map(err => {
      const field = err.path.join('.');
      return `- ${field}: ${err.message}`;
    })
    .join('\n');
}

// Validate environment variables
export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedError = formatZodError(result.error);
    console.error('❌ Invalid environment variables:\n' + formattedError);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

// Export environment variables
export const env = (() => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    // Just return an empty object in case of failure
    // The validateEnv function will throw a more detailed error when called
    return {} as Env;
  }
  return result.data;
})();

// Optional environment variables with default values
export const ENV = {
  NODE_ENV: (process.env.NODE_ENV as NodeEnv) || 'development',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:3000/api',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;
