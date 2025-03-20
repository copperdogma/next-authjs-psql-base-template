// Common type definitions for the project

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
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