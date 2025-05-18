import { z } from 'zod';
import { logger } from './logger'; // Import logger

// Environment variables schema
const envSchema = z
  .object({
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
    NEXT_PUBLIC_USE_FIREBASE_EMULATOR: z.preprocess(
      val => String(val).toLowerCase() === 'true', // Convert to boolean
      z.boolean().optional().default(false) // Default to false if not set or invalid string
    ),

    // Firebase Admin SDK
    FIREBASE_PROJECT_ID: z.string({
      required_error: 'FIREBASE_PROJECT_ID is required',
    }),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),

    // Database
    DATABASE_URL: z.string({
      required_error: 'DATABASE_URL is required',
      invalid_type_error: 'DATABASE_URL must be a string',
    }),
    REDIS_URL: z.preprocess(
      val => (val === '' ? undefined : val), // Treat empty string as undefined
      z
        .string()
        .url({
          message:
            'If REDIS_URL is provided, it must be a valid Redis connection URI (e.g., redis://localhost:6379).',
        })
        .refine(url => url.startsWith('redis://') || url.startsWith('rediss://'), {
          message: 'If REDIS_URL is provided, it must start with redis:// or rediss://',
        })
        .optional()
    ),
    RATE_LIMIT_REGISTER_MAX_ATTEMPTS: z.preprocess(
      val => (val === '' ? undefined : val), // Treat empty string as undefined
      z
        .string()
        .optional()
        .default('10')
        .transform(val => parseInt(val, 10))
        .refine(val => !isNaN(val) && val > 0, {
          message: 'RATE_LIMIT_REGISTER_MAX_ATTEMPTS must be a positive number.',
        })
    ),
    RATE_LIMIT_REGISTER_WINDOW_SECONDS: z.preprocess(
      val => (val === '' ? undefined : val), // Treat empty string as undefined
      z
        .string()
        .optional()
        .default('3600') // 1 hour
        .transform(val => parseInt(val, 10))
        .refine(val => !isNaN(val) && val > 0, {
          message: 'RATE_LIMIT_REGISTER_WINDOW_SECONDS must be a positive number.',
        })
    ),
    ENABLE_REDIS_RATE_LIMITING: z.preprocess(
      val => (val === '' ? undefined : val), // Treat empty string as undefined
      z
        .string()
        .optional()
        .default('true') // Default to 'true'
        .transform(val => val.toLowerCase() === 'true') // Convert string to boolean
    ),

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
  })
  .refine(
    data => {
      // If NEXT_PUBLIC_USE_FIREBASE_EMULATOR is false (or undefined, defaulting to false),
      // then FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be present.
      if (!data.NEXT_PUBLIC_USE_FIREBASE_EMULATOR) {
        return !!data.FIREBASE_CLIENT_EMAIL && !!data.FIREBASE_PRIVATE_KEY;
      }
      return true; // Emulator is used, so these are not strictly required by the schema anymore
    },
    {
      // This message will be shown if the refine condition fails.
      // We provide path for one of the fields to associate the error.
      message:
        'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required when not using Firebase emulators.',
      path: ['FIREBASE_CLIENT_EMAIL'], // Or ['FIREBASE_PRIVATE_KEY']
    }
  );

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
  'DATABASE_URL',
  // 'REDIS_URL', // No longer strictly required for app startup if optional
  'RATE_LIMIT_REGISTER_MAX_ATTEMPTS',
  'RATE_LIMIT_REGISTER_WINDOW_SECONDS',

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
export function validateEnv(): z.SafeParseReturnType<Env, Env> {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Only log and throw if NOT in the test environment
    if (process.env.NODE_ENV !== 'test') {
      const formattedError = formatZodError(result.error);
      logger.error(
        {
          validationErrors: result.error.format(),
        },
        `❌ Invalid environment variables:\n${formattedError}`
      );
      throw new Error('Invalid environment variables');
    } else {
      // Optionally, log a less intrusive message in test env, or nothing
      // console.log('Skipping env validation error logging in test environment.');
    }
  }

  // Return the result regardless of environment, tests might want to inspect it
  return result;
}

// Export environment variables
export const env = (() => {
  // Directly use the result from validateEnv to keep logic consistent
  const validationResult = validateEnv();
  if (!validationResult.success) {
    // Return an empty object in case of failure, matching previous behavior
    return {} as Env;
  }
  return validationResult.data;
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
