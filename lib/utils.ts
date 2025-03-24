import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single string and resolves Tailwind CSS conflicts.
 *
 * This utility uses clsx to handle conditional classes (objects, arrays, etc.) and
 * tailwind-merge to intelligently resolve conflicting Tailwind classes where later
 * classes take precedence over earlier ones.
 *
 * @example
 * // Basic usage
 * cn('text-red-500', 'bg-blue-500')
 *
 * @example
 * // With conditional classes
 * cn('px-4 py-2', { 'bg-blue-500': isPrimary, 'bg-gray-500': !isPrimary })
 *
 * @example
 * // With component variants and props
 * cn(buttonVariants({ variant, size }), className)
 *
 * @param {...ClassValue[]} inputs - Class values to be merged (strings, objects, arrays)
 * @returns {string} A string of merged classes with conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
