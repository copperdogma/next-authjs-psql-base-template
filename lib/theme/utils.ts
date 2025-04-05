'use client';

/**
 * Get theme based on time of day
 * Returns 'dark' during evening hours and 'light' during day
 */
export function getTimeBasedTheme(): 'light' | 'dark' {
  const currentHour = new Date().getHours();

  // Dark mode from 7 PM to 6 AM
  return currentHour >= 19 || currentHour < 6 ? 'dark' : 'light';
}
