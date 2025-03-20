import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  // Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string(),

  // Firebase Admin SDK
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),

  // Database
  POSTGRES_URL: z.string(),
  REDIS_URL: z.string(),
  DATABASE_URL: z.string(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),

  // PWA
  NEXT_PUBLIC_PWA_APP_NAME: z.string().optional(),
  NEXT_PUBLIC_PWA_APP_SHORT_NAME: z.string().optional(),
  NEXT_PUBLIC_PWA_APP_DESCRIPTION: z.string(),
});

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

  // PWA
  'NEXT_PUBLIC_PWA_APP_NAME',
  'NEXT_PUBLIC_PWA_APP_SHORT_NAME',
  'NEXT_PUBLIC_PWA_APP_DESCRIPTION',
] as const;

// Validate environment variables
export function validateEnv() {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
}

// Export environment variables
export const env = envSchema.parse(process.env);

// Optional environment variables with default values
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:3000/api',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const; 