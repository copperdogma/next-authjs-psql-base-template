/**
 * This file tests that Jest is properly using SWC for test transpilation.
 * It includes modern JavaScript/TypeScript features that should be transpiled by SWC.
 */

describe('SWC Feature Transpilation', () => {
  test('Optional Chaining', () => {
    const user = { profile: null as { name: string } | null };
    expect(user.profile?.name).toBeUndefined();
  });

  test('Nullish Coalescing', () => {
    const value = 0;
    const result = value ?? 10;
    expect(result).toBe(0);
  });

  test('Async/Await', async () => {
    const fetchProfile = async (): Promise<{ profile?: { name: string } }> => ({
      profile: { name: 'Test User' },
    });
    const result = await fetchProfile();
    expect(result.profile?.name).toBe('Test User');
  });

  test('Class Private Fields', () => {
    class User {
      #privateField = 'private';
      getPrivateField() {
        return this.#privateField;
      }
    }
    const user = new User();
    expect(user.getPrivateField()).toBe('private');
  });

  test('Rest/Spread Operators', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { c: 3, ...obj1 };
    expect(obj2).toEqual({ a: 1, b: 2, c: 3 });

    const [first, ...rest] = [1, 2, 3, 4];
    expect(first).toBe(1);
    expect(rest).toEqual([2, 3, 4]);
  });
});
