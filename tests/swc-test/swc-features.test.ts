/**
 * This test verifies SWC transpilation features in the test environment.
 * It includes modern JavaScript/TypeScript features that should be properly
 * transpiled by SWC.
 */

describe('SWC Transpilation Features', () => {
  it('supports optional chaining', () => {
    const user = {
      profile: {
        name: 'Test User',
      },
    };

    const emptyUser = {};

    // Optional chaining - should be transpiled correctly
    expect(user?.profile?.name).toBe('Test User');
    expect(emptyUser?.profile?.name).toBeUndefined();
  });

  it('supports nullish coalescing', () => {
    const value1 = null;
    const value2 = 0;

    // Nullish coalescing - should be transpiled correctly
    expect(value1 ?? 'default').toBe('default');
    expect(value2 ?? 'default').toBe(0);
  });

  it('supports async/await', async () => {
    // Async/await - should be transpiled correctly
    const asyncFunction = async () => {
      return 'async result';
    };

    const result = await asyncFunction();
    expect(result).toBe('async result');
  });

  it('supports class private fields', () => {
    // Class with private field - should be transpiled correctly
    class TestClass {
      #privateField = 'private';

      getPrivateField() {
        return this.#privateField;
      }
    }

    const instance = new TestClass();
    expect(instance.getPrivateField()).toBe('private');
  });

  it('supports rest/spread operators', () => {
    // Rest/spread operators - should be transpiled correctly
    const obj1 = { a: 1, b: 2 };
    const obj2 = { c: 3, ...obj1 };

    expect(obj2).toEqual({ a: 1, b: 2, c: 3 });

    const array1 = [1, 2, 3];
    const array2 = [...array1, 4, 5];

    expect(array2).toEqual([1, 2, 3, 4, 5]);
  });
});
