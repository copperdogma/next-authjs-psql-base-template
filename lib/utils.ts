/**
 * Combines multiple class values into a single string.
 *
 * @example
 * // Basic usage
 * classNames('foo', 'bar') // => 'foo bar'
 *
 * @example
 * // With conditional classes
 * classNames('foo', { bar: true, baz: false }) // => 'foo bar'
 *
 * @param {...(string|Record<string, boolean>|null|undefined)[]} classes - Class values to be merged
 * @returns {string} A string of merged classes
 */
export function classNames(
  ...classes: (string | Record<string, boolean> | null | undefined)[]
): string {
  return classes
    .filter((cls): cls is string | Record<string, boolean> => cls !== null && cls !== undefined)
    .map(cls => {
      if (typeof cls === 'string') {
        return cls.trim();
      }
      return Object.entries(cls)
        .filter(([, value]) => value)
        .map(([key]) => key)
        .join(' ');
    })
    .filter(Boolean)
    .join(' ');
}

// This function can be modified to exclude specific fields from the db data when needed
export function cleanDbData<T extends Record<string, any>>(data: T): Omit<T, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = data;
  return rest;
}
