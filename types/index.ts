// Common type definitions for the project

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

// User type variants using utility types
export type ReadonlyUser = Readonly<User>;
export type UserWithRequiredProfile = Required<Pick<User, 'name' | 'image'>> &
  Omit<User, 'name' | 'image'>;
export type PublicUser = Omit<User, 'id'>;
export type UserUpdate = Partial<Omit<User, 'id'>>;

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Standardized Service Error class
export class ServiceError extends Error {
  public readonly cause?: unknown;
  public readonly code?: string; // Application-specific error code or key

  constructor(code?: string, message?: string, cause?: unknown) {
    super(message);
    this.name = 'ServiceError'; // Consistent error name
    this.code = code;
    this.cause = cause;
    // For Node.js environments, you might want to capture the stack trace properly:
    // if (typeof Error.captureStackTrace === 'function') {
    //   Error.captureStackTrace(this, this.constructor);
    // }
  }
}

// Standardized Service Response interface
export interface ServiceResponse<TData = unknown, TErrorDetails = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: TData;
  error?: {
    message: string; // User-facing error message
    code?: string; // Application-specific error code
    details?: TErrorDetails; // Detailed error information, stack, or original error
    isServiceError?: boolean; // Flag to indicate if it's a ServiceError instance
  };
  errors?: Record<string, string[]>; // For field-specific validation errors from Zod, etc.
}

// HTTP Status Codes enum for consistent usage across the application
export enum HttpStatusCode {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

// Re-export UserRole directly from Prisma client to ensure consistency
export { UserRole } from '@prisma/client';

// Database types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Cache types
export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
}
