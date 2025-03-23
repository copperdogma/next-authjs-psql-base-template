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

// User Role enum
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

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
