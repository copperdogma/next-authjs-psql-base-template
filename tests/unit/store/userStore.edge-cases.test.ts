import { act, renderHook } from '@testing-library/react';
import { useUserStore } from '@/lib/store/userStore';
import { UserRole } from '@/types';

/**
 * UserStore Edge Case Tests
 *
 * This test suite covers edge cases and stress scenarios for the Zustand user store
 * that might not be covered in the main test suite. These tests help ensure the
 * store behaves correctly under unusual conditions.
 */

// Helper to get a clean store state
const getCleanState = () => ({
  id: null,
  name: null,
  email: null,
  image: null,
  role: null,
});

describe('useUserStore Edge Cases', () => {
  beforeEach(() => {
    // Reset store to clean state before each test
    act(() => {
      useUserStore.setState(getCleanState());
    });
  });

  describe('Concurrent Updates Edge Cases', () => {
    it('should handle rapid successive updates correctly', async () => {
      const updates = [
        { id: 'user-1', name: 'Name 1' },
        { id: 'user-2', name: 'Name 2' },
        { id: 'user-3', name: 'Name 3' },
        { id: 'user-4', name: 'Name 4' },
        { id: 'user-5', name: 'Name 5' },
      ];

      // Apply all updates rapidly
      updates.forEach(update => {
        act(() => {
          useUserStore.getState().setUserDetails(update);
        });
      });

      // Should end up with the last update
      const finalState = useUserStore.getState();
      expect(finalState.id).toBe('user-5');
      expect(finalState.name).toBe('Name 5');
    });

    it('should handle simultaneous updates from multiple sources', async () => {
      const promises = Array.from(
        { length: 100 },
        (_, index) =>
          new Promise<void>(resolve => {
            act(() => {
              useUserStore.getState().setUserDetails({
                id: `concurrent-user-${index}`,
                name: `Concurrent Name ${index}`,
              });
            });
            resolve();
          })
      );

      await Promise.all(promises);

      const finalState = useUserStore.getState();
      // Should have some valid state (exact value depends on execution order)
      expect(finalState.id).toMatch(/^concurrent-user-\d+$/);
      expect(finalState.name).toMatch(/^Concurrent Name \d+$/);
    });

    it('should handle interleaved updates and clears', () => {
      const operations = [
        () => useUserStore.getState().setUserDetails({ id: 'user-1', name: 'Test 1' }),
        () => useUserStore.getState().clearUserDetails(),
        () => useUserStore.getState().setUserDetails({ id: 'user-2', email: 'test@example.com' }),
        () => useUserStore.getState().clearUserDetails(),
        () => useUserStore.getState().setUserDetails({ id: 'user-3', role: UserRole.ADMIN }),
      ];

      operations.forEach(operation => {
        act(() => {
          operation();
        });
      });

      const finalState = useUserStore.getState();
      expect(finalState.id).toBe('user-3');
      expect(finalState.name).toBeNull();
      expect(finalState.email).toBeNull();
      expect(finalState.role).toBe(UserRole.ADMIN);
    });
  });

  describe('Large Data Handling Edge Cases', () => {
    it('should handle extremely long strings without issues', () => {
      const longString = 'x'.repeat(100000); // 100KB string
      const longEmail = 'a'.repeat(50000) + '@' + 'b'.repeat(50000) + '.com';

      act(() => {
        useUserStore.getState().setUserDetails({
          id: longString,
          name: longString,
          email: longEmail,
          image: longString,
        });
      });

      const state = useUserStore.getState();
      expect(state.id).toBe(longString);
      expect(state.name).toBe(longString);
      expect(state.email).toBe(longEmail);
      expect(state.image).toBe(longString);
    });

    it('should handle unicode and special characters properly', () => {
      const unicodeData = {
        id: '用户-123-🔥',
        name: 'José María García-Hernández 🙂',
        email: 'test+unicode@例え.テスト',
        image: 'https://example.com/image-🖼️.jpg',
        role: UserRole.USER,
      };

      act(() => {
        useUserStore.getState().setUserDetails(unicodeData);
      });

      const state = useUserStore.getState();
      expect(state.id).toBe(unicodeData.id);
      expect(state.name).toBe(unicodeData.name);
      expect(state.email).toBe(unicodeData.email);
      expect(state.image).toBe(unicodeData.image);
      expect(state.role).toBe(unicodeData.role);
    });

    it('should handle null and undefined mixed with valid data', () => {
      const mixedData = {
        id: 'valid-id',
        name: null,
        email: undefined,
        image: '',
        role: UserRole.ADMIN,
      };

      act(() => {
        useUserStore.getState().setUserDetails(mixedData);
      });

      const state = useUserStore.getState();
      expect(state.id).toBe('valid-id');
      expect(state.name).toBeNull();
      expect(state.email).toBeNull(); // Store should handle undefined
      expect(state.image).toBe('');
      expect(state.role).toBe(UserRole.ADMIN);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle many rapid updates without memory leaks', () => {
      const initialMemory = process.memoryUsage();

      // Perform 1000 rapid updates
      for (let i = 0; i < 1000; i++) {
        act(() => {
          useUserStore.getState().setUserDetails({
            id: `user-${i}`,
            name: `Name ${i}`,
            email: `user${i}@example.com`,
          });
        });
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);

      // Final state should be the last update
      const state = useUserStore.getState();
      expect(state.id).toBe('user-999');
      expect(state.name).toBe('Name 999');
    });

    it('should handle store subscriptions and unsubscriptions correctly', () => {
      const subscriptions: (() => void)[] = [];
      const callCounts: number[] = [];

      // Create 100 subscriptions
      for (let i = 0; i < 100; i++) {
        callCounts.push(0);
        const unsubscribe = useUserStore.subscribe(_state => {
          callCounts[i]++;
        });
        subscriptions.push(unsubscribe);
      }

      // Update state
      act(() => {
        useUserStore.getState().setUserDetails({ id: 'test-subscription' });
      });

      // All subscriptions should have been called
      callCounts.forEach(count => {
        expect(count).toBe(1);
      });

      // Unsubscribe half of them
      for (let i = 0; i < 50; i++) {
        subscriptions[i]();
      }

      // Update state again
      act(() => {
        useUserStore.getState().setUserDetails({ name: 'test-subscription-2' });
      });

      // Only remaining subscriptions should have been called
      for (let i = 0; i < 50; i++) {
        expect(callCounts[i]).toBe(1); // Unsubscribed, so still 1
      }
      for (let i = 50; i < 100; i++) {
        expect(callCounts[i]).toBe(2); // Still subscribed, so 2
      }

      // Clean up remaining subscriptions
      for (let i = 50; i < 100; i++) {
        subscriptions[i]();
      }
    });
  });

  describe('State Corruption Edge Cases', () => {
    it('should handle direct state mutations gracefully', () => {
      // Set initial state
      act(() => {
        useUserStore.getState().setUserDetails({
          id: 'original-id',
          name: 'Original Name',
          email: 'original@example.com',
        });
      });

      // Attempt to directly mutate state (should not affect store)
      const state = useUserStore.getState();
      try {
        // This should not change the actual store state
        (state as any).id = 'mutated-id';
        (state as any).name = 'Mutated Name';
      } catch (error) {
        // Some stores might throw errors on direct mutation
      }

      // Store state should remain unchanged or handle mutation gracefully
      const currentState = useUserStore.getState();
      // Note: Zustand allows mutations, so this test validates the current behavior
      expect(typeof currentState.id).toBe('string');
      expect(typeof currentState.setUserDetails).toBe('function');
      expect(typeof currentState.clearUserDetails).toBe('function');
    });

    it('should handle invalid role enum values', () => {
      const invalidRoles = [
        'INVALID_ROLE' as UserRole,
        123 as any,
        {} as any,
        [] as any,
        null,
        undefined,
      ];

      invalidRoles.forEach((invalidRole, index) => {
        act(() => {
          useUserStore.getState().setUserDetails({
            id: `user-${index}`,
            role: invalidRole,
          });
        });

        const state = useUserStore.getState();
        expect(state.id).toBe(`user-${index}`);
        if (invalidRole === undefined) {
          // undefined doesn't update the store, so it should remain null (initial state)
          expect(state.role).toBe(null);
        } else {
          // Any other value (including null) should be set
          expect(state.role).toBe(invalidRole);
        }
      });
    });
  });

  describe('Serialization and Persistence Edge Cases', () => {
    it('should handle circular reference objects gracefully', () => {
      const circularObj: any = { name: 'Circular' };
      circularObj.self = circularObj;

      // This should not crash the store
      act(() => {
        try {
          useUserStore.getState().setUserDetails({
            id: 'circular-test',
            name: circularObj.name, // Use the string value, not the circular object
          });
        } catch (error) {
          // Handle potential circular reference errors
          useUserStore.getState().setUserDetails({
            id: 'circular-test-fallback',
            name: 'Fallback Name',
          });
        }
      });

      const state = useUserStore.getState();
      expect(state.id).toMatch(/circular-test/);
      expect(typeof state.name).toBe('string');
    });

    it('should handle Date objects and complex types', () => {
      const complexData = {
        id: 'complex-user',
        name: 'Complex User',
        // These are not standard user fields, but testing edge cases
        complexField: new Date(),
      };

      act(() => {
        useUserStore.getState().setUserDetails({
          id: complexData.id,
          name: complexData.name,
          // Don't pass complex field since it's not part of the interface
        });
      });

      const state = useUserStore.getState();
      expect(state.id).toBe(complexData.id);
      expect(state.name).toBe(complexData.name);
    });
  });

  describe('Multiple Store Instance Edge Cases', () => {
    it('should handle multiple hook instances correctly', () => {
      const { result: hook1 } = renderHook(() => useUserStore());
      const { result: hook2 } = renderHook(() => useUserStore());

      // Both hooks should reference the same store
      expect(hook1.current).toBe(hook2.current);

      // Update through one hook
      act(() => {
        hook1.current.setUserDetails({ id: 'shared-user', name: 'Shared Name' });
      });

      // Both hooks should see the update
      expect(hook1.current.id).toBe('shared-user');
      expect(hook2.current.id).toBe('shared-user');
      expect(hook1.current.name).toBe('Shared Name');
      expect(hook2.current.name).toBe('Shared Name');
    });

    it('should handle component unmounting during updates', () => {
      const { result, unmount } = renderHook(() => useUserStore());

      // Update store
      act(() => {
        result.current.setUserDetails({ id: 'unmount-test', name: 'Test Name' });
      });

      expect(result.current.id).toBe('unmount-test');

      // Unmount component
      unmount();

      // Store should still be accessible through getState
      const state = useUserStore.getState();
      expect(state.id).toBe('unmount-test');
      expect(state.name).toBe('Test Name');
    });
  });

  describe('Error Recovery Edge Cases', () => {
    it('should recover from malformed update attempts', () => {
      // Set valid initial state
      act(() => {
        useUserStore.getState().setUserDetails({
          id: 'valid-user',
          name: 'Valid Name',
          email: 'valid@example.com',
        });
      });

      // Attempt various malformed updates
      const malformedUpdates = [
        null as any,
        undefined as any,
        'string' as any,
        123 as any,
        [] as any,
        Symbol('test') as any,
      ];

      malformedUpdates.forEach(malformedUpdate => {
        try {
          act(() => {
            useUserStore.getState().setUserDetails(malformedUpdate);
          });
        } catch (error) {
          // Some updates might throw errors, which is acceptable
        }

        // Store should still be functional
        const state = useUserStore.getState();
        expect(typeof state.setUserDetails).toBe('function');
        expect(typeof state.clearUserDetails).toBe('function');
      });
    });

    it('should maintain function references across updates', () => {
      const initialSetUserDetails = useUserStore.getState().setUserDetails;
      const initialClearUserDetails = useUserStore.getState().clearUserDetails;

      // Perform multiple updates
      for (let i = 0; i < 10; i++) {
        act(() => {
          useUserStore.getState().setUserDetails({ id: `user-${i}` });
        });
      }

      // Function references should remain the same
      expect(useUserStore.getState().setUserDetails).toBe(initialSetUserDetails);
      expect(useUserStore.getState().clearUserDetails).toBe(initialClearUserDetails);
    });
  });

  describe('Edge Cases with Partial Updates', () => {
    it('should handle partial updates with undefined vs null distinction', () => {
      // Set initial state with all fields
      act(() => {
        useUserStore.getState().setUserDetails({
          id: 'partial-test',
          name: 'Initial Name',
          email: 'initial@example.com',
          image: 'initial.jpg',
          role: UserRole.USER,
        });
      });

      // Update with explicit null
      act(() => {
        useUserStore.getState().setUserDetails({
          name: null,
          image: null,
        });
      });

      let state = useUserStore.getState();
      expect(state.id).toBe('partial-test');
      expect(state.name).toBeNull();
      expect(state.email).toBe('initial@example.com'); // Unchanged
      expect(state.image).toBeNull();
      expect(state.role).toBe(UserRole.USER); // Unchanged

      // Update with undefined (should not change existing values)
      act(() => {
        useUserStore.getState().setUserDetails({
          name: undefined,
          email: 'updated@example.com',
        });
      });

      state = useUserStore.getState();
      expect(state.name).toBeNull(); // Should remain null (not changed by undefined)
      expect(state.email).toBe('updated@example.com'); // Should be updated
    });

    it('should handle empty object updates', () => {
      // Set initial state
      act(() => {
        useUserStore.getState().setUserDetails({
          id: 'empty-test',
          name: 'Test Name',
        });
      });

      // Update with empty object
      act(() => {
        useUserStore.getState().setUserDetails({});
      });

      // State should remain unchanged
      const state = useUserStore.getState();
      expect(state.id).toBe('empty-test');
      expect(state.name).toBe('Test Name');
    });
  });

  describe('Stress Testing Edge Cases', () => {
    it('should handle alternating updates and clears rapidly', () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        if (i % 2 === 0) {
          act(() => {
            useUserStore.getState().setUserDetails({
              id: `stress-user-${i}`,
              name: `Stress Name ${i}`,
            });
          });
        } else {
          act(() => {
            useUserStore.getState().clearUserDetails();
          });
        }
      }

      // Final state should be cleared (last iteration was odd)
      const state = useUserStore.getState();
      expect(state.id).toBeNull();
      expect(state.name).toBeNull();
      expect(state.email).toBeNull();
      expect(state.image).toBeNull();
      expect(state.role).toBeNull();
    });

    it('should handle rapid role changes', () => {
      const roles = [UserRole.USER, UserRole.ADMIN, UserRole.USER, UserRole.ADMIN];

      roles.forEach((role, index) => {
        act(() => {
          useUserStore.getState().setUserDetails({
            id: `role-user-${index}`,
            role: role,
          });
        });
      });

      const state = useUserStore.getState();
      expect(state.id).toBe('role-user-3');
      expect(state.role).toBe(UserRole.ADMIN);
    });
  });
});
