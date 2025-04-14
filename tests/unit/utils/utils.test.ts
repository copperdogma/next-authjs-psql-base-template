import { classNames, cleanDbData } from '../../../lib/utils';

describe('classNames and cn function', () => {
  test('merges string class names correctly', () => {
    // Arrange & Act
    const result = classNames('foo', 'bar');

    // Assert
    expect(result).toBe('foo bar');
  });

  test('filters out null and undefined values', () => {
    // Arrange & Act
    const result = classNames('foo', null, undefined, 'bar');

    // Assert
    expect(result).toBe('foo bar');
  });

  test('handles conditional classes as objects', () => {
    // Arrange & Act
    const result = classNames('foo', { bar: true, baz: false });

    // Assert
    expect(result).toBe('foo bar');
  });

  test('handles complex combinations', () => {
    // Arrange & Act
    const result = classNames(
      'base-class',
      null,
      { 'conditional-a': true, 'conditional-b': false },
      undefined,
      'explicit-class',
      { 'conditional-c': true }
    );

    // Assert
    expect(result).toBe('base-class conditional-a explicit-class conditional-c');
  });

  test('trims whitespace from class names', () => {
    // Arrange & Act
    const result = classNames(' foo ', ' bar');

    // Assert
    expect(result).toBe('foo bar');
  });

  test('handles empty inputs correctly', () => {
    // Arrange & Act
    const result1 = classNames();
    const result2 = classNames('');
    const result3 = classNames({});

    // Assert
    expect(result1).toBe('');
    expect(result2).toBe('');
    expect(result3).toBe('');
  });

  test('cn is an alias for classNames', () => {
    // Arrange
    const args = ['foo', { bar: true, baz: false }];

    // Act
    const result1 = classNames(...args);

    // Assert
    expect(result1).toBe('foo bar');
  });
});

describe('cleanDbData function', () => {
  test('removes password field from data object', () => {
    // Arrange
    const data = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password: 'secret123',
      role: 'user',
    };

    // Act
    const cleaned = cleanDbData(data);

    // Assert
    expect(cleaned).toEqual({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
    });
    expect(cleaned).not.toHaveProperty('password');
  });

  test('returns original object when no password field exists', () => {
    // Arrange
    const data = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    };

    // Act
    const cleaned = cleanDbData(data);

    // Assert
    expect(cleaned).toEqual(data);
  });

  test('works with empty objects', () => {
    // Arrange
    const data = {};

    // Act
    const cleaned = cleanDbData(data);

    // Assert
    expect(cleaned).toEqual({});
  });
});
