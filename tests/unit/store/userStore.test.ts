import { act } from '@testing-library/react';
import { useUserStore } from '@/lib/store/userStore';
import { UserRole } from '@/types';

// Helper to get the initial state before each test
const getInitialState = () => useUserStore.getState();

describe('useUserStore', () => {
  // Reset store to initial state before each test
  beforeEach(() => {
    act(() => {
      useUserStore.setState(getInitialState()); // Reset to the actual initial state
    });
  });

  it('should initialize with null values', () => {
    const state = useUserStore.getState();
    expect(state.id).toBeNull();
    expect(state.name).toBeNull();
    expect(state.email).toBeNull();
    expect(state.image).toBeNull();
    expect(state.role).toBeNull();
  });

  describe('setUserDetails', () => {
    it('should update all user details when provided', () => {
      const newUserDetails = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        image: 'image.png',
        role: UserRole.ADMIN,
      };

      act(() => {
        useUserStore.getState().setUserDetails(newUserDetails);
      });

      const state = useUserStore.getState();
      expect(state.id).toBe(newUserDetails.id);
      expect(state.name).toBe(newUserDetails.name);
      expect(state.email).toBe(newUserDetails.email);
      expect(state.image).toBe(newUserDetails.image);
      expect(state.role).toBe(newUserDetails.role);
    });

    it('should update only provided details, keeping others unchanged', () => {
      // Set initial partial state
      const initialDetails = {
        id: 'user-456',
        name: 'Initial Name',
        email: 'initial@example.com',
        image: null,
        role: UserRole.USER,
      };
      act(() => {
        useUserStore.getState().setUserDetails(initialDetails);
      });

      // Update only name and image
      const partialUpdate = {
        name: 'Updated Name',
        image: 'new-image.jpg',
      };
      act(() => {
        useUserStore.getState().setUserDetails(partialUpdate);
      });

      const state = useUserStore.getState();
      expect(state.id).toBe(initialDetails.id); // Should remain unchanged
      expect(state.name).toBe(partialUpdate.name); // Should be updated
      expect(state.email).toBe(initialDetails.email); // Should remain unchanged
      expect(state.image).toBe(partialUpdate.image); // Should be updated
      expect(state.role).toBe(initialDetails.role); // Should remain unchanged
    });

    it('should correctly handle null values in updates', () => {
      // Set initial state
      const initialDetails = {
        id: 'user-789',
        name: 'Has Name',
        email: 'has@example.com',
        image: 'has-image.png',
        role: UserRole.USER,
      };
      act(() => {
        useUserStore.getState().setUserDetails(initialDetails);
      });

      // Update name and image to null
      const nullUpdate = {
        name: null,
        image: null,
      };
      act(() => {
        useUserStore.getState().setUserDetails(nullUpdate);
      });

      const state = useUserStore.getState();
      expect(state.id).toBe(initialDetails.id);
      expect(state.name).toBeNull(); // Updated to null
      expect(state.email).toBe(initialDetails.email);
      expect(state.image).toBeNull(); // Updated to null
      expect(state.role).toBe(initialDetails.role);
    });

    it('should not update fields if they are undefined in the details object', () => {
      // Set initial state
      const initialDetails = {
        id: 'user-abc',
        name: 'Keep Name',
        email: 'keep@example.com',
        image: 'keep-image.png',
        role: UserRole.ADMIN,
      };
      act(() => {
        useUserStore.getState().setUserDetails(initialDetails);
      });

      // Provide an update object with undefined fields
      const undefinedUpdate = {
        name: undefined,
        email: 'update@example.com', // Only update email
      };
      act(() => {
        useUserStore.getState().setUserDetails(undefinedUpdate);
      });

      const state = useUserStore.getState();
      expect(state.id).toBe(initialDetails.id);
      expect(state.name).toBe(initialDetails.name); // Should not change because update was undefined
      expect(state.email).toBe(undefinedUpdate.email); // Should update
      expect(state.image).toBe(initialDetails.image);
      expect(state.role).toBe(initialDetails.role);
    });

    // Test for granular checks for undefined updates
    it('should retain existing state field if corresponding update field is undefined', () => {
      // Set initial full state
      const initialFullDetails = {
        id: 'init-id',
        name: 'Init Name',
        email: 'init@example.com',
        image: 'init.png',
        role: UserRole.ADMIN,
      };
      act(() => {
        useUserStore.getState().setUserDetails(initialFullDetails);
      });

      // Test undefined ID
      act(() => {
        useUserStore.getState().setUserDetails({ id: undefined, name: 'Update 1' });
      });
      expect(useUserStore.getState().id).toBe(initialFullDetails.id);
      expect(useUserStore.getState().name).toBe('Update 1');

      // Test undefined Name (reset email)
      act(() => {
        useUserStore.getState().setUserDetails({ name: undefined, email: 'Update 2' });
      });
      expect(useUserStore.getState().name).toBe('Update 1'); // Should retain previous update
      expect(useUserStore.getState().email).toBe('Update 2');

      // Test undefined Email (reset image)
      act(() => {
        useUserStore.getState().setUserDetails({ email: undefined, image: 'Update 3' });
      });
      expect(useUserStore.getState().email).toBe('Update 2');
      expect(useUserStore.getState().image).toBe('Update 3');

      // Test undefined Image (reset role)
      act(() => {
        useUserStore.getState().setUserDetails({ image: undefined, role: UserRole.USER });
      });
      expect(useUserStore.getState().image).toBe('Update 3');
      expect(useUserStore.getState().role).toBe(UserRole.USER);

      // Test undefined Role (reset id)
      act(() => {
        useUserStore.getState().setUserDetails({ role: undefined, id: 'Update 4' });
      });
      expect(useUserStore.getState().role).toBe(UserRole.USER);
      expect(useUserStore.getState().id).toBe('Update 4');

      // Final check of all fields
      const finalState = useUserStore.getState();
      expect(finalState.id).toBe('Update 4');
      expect(finalState.name).toBe('Update 1');
      expect(finalState.email).toBe('Update 2');
      expect(finalState.image).toBe('Update 3');
      expect(finalState.role).toBe(UserRole.USER);
    });

    it('should individually test retaining state for each field when update is undefined', () => {
      const initialDetails = {
        id: 'id-0',
        name: 'Name-0',
        email: 'email-0@example.com',
        image: 'image-0.png',
        role: UserRole.USER,
      };
      act(() => {
        useUserStore.getState().setUserDetails(initialDetails);
      });

      // Test undefined id - only id should remain initialDetails.id
      act(() => {
        useUserStore.getState().setUserDetails({ name: 'New Name After Undefined ID' }); // Change another field to ensure reset for next step
        useUserStore.getState().setUserDetails({ id: undefined });
      });
      let state = useUserStore.getState();
      expect(state.id).toBe(initialDetails.id);
      expect(state.name).toBe('New Name After Undefined ID'); // Verify other field changed as expected

      // Reset state and test undefined name
      act(() => {
        useUserStore.getState().setUserDetails(initialDetails); // Reset to known state
        useUserStore.getState().setUserDetails({ email: 'new-email@example.com' }); // Change another field
        useUserStore.getState().setUserDetails({ name: undefined });
      });
      state = useUserStore.getState();
      expect(state.name).toBe(initialDetails.name);
      expect(state.email).toBe('new-email@example.com');

      // Reset state and test undefined email
      act(() => {
        useUserStore.getState().setUserDetails(initialDetails);
        useUserStore.getState().setUserDetails({ image: 'new-image.png' });
        useUserStore.getState().setUserDetails({ email: undefined });
      });
      state = useUserStore.getState();
      expect(state.email).toBe(initialDetails.email);
      expect(state.image).toBe('new-image.png');

      // Reset state and test undefined image
      act(() => {
        useUserStore.getState().setUserDetails(initialDetails);
        useUserStore.getState().setUserDetails({ role: UserRole.ADMIN });
        useUserStore.getState().setUserDetails({ image: undefined });
      });
      state = useUserStore.getState();
      expect(state.image).toBe(initialDetails.image);
      expect(state.role).toBe(UserRole.ADMIN);

      // Reset state and test undefined role
      act(() => {
        useUserStore.getState().setUserDetails(initialDetails);
        useUserStore.getState().setUserDetails({ id: 'new-id-check' });
        useUserStore.getState().setUserDetails({ role: undefined });
      });
      state = useUserStore.getState();
      expect(state.role).toBe(initialDetails.role);
      expect(state.id).toBe('new-id-check');
    });

    // Add test cases for each conditional branch in setUserDetails
    it('should handle all conditional branches in setUserDetails', () => {
      // First clear the state to start with a clean slate
      act(() => {
        useUserStore.getState().clearUserDetails();
      });

      // Test with empty update object (should preserve null state)
      act(() => {
        useUserStore.getState().setUserDetails({});
      });
      expect(useUserStore.getState().id).toBeNull();
      expect(useUserStore.getState().name).toBeNull();
      expect(useUserStore.getState().email).toBeNull();
      expect(useUserStore.getState().image).toBeNull();
      expect(useUserStore.getState().role).toBeNull();

      // Test with only id defined
      act(() => {
        useUserStore.getState().setUserDetails({ id: 'only-id' });
      });
      expect(useUserStore.getState().id).toBe('only-id');
      expect(useUserStore.getState().name).toBeNull();
      expect(useUserStore.getState().email).toBeNull();
      expect(useUserStore.getState().image).toBeNull();
      expect(useUserStore.getState().role).toBeNull();

      // Test with only name defined
      act(() => {
        useUserStore.getState().clearUserDetails();
        useUserStore.getState().setUserDetails({ name: 'only-name' });
      });
      expect(useUserStore.getState().id).toBeNull();
      expect(useUserStore.getState().name).toBe('only-name');
      expect(useUserStore.getState().email).toBeNull();
      expect(useUserStore.getState().image).toBeNull();
      expect(useUserStore.getState().role).toBeNull();

      // Test with only email defined
      act(() => {
        useUserStore.getState().clearUserDetails();
        useUserStore.getState().setUserDetails({ email: 'only@email.com' });
      });
      expect(useUserStore.getState().id).toBeNull();
      expect(useUserStore.getState().name).toBeNull();
      expect(useUserStore.getState().email).toBe('only@email.com');
      expect(useUserStore.getState().image).toBeNull();
      expect(useUserStore.getState().role).toBeNull();

      // Test with only image defined
      act(() => {
        useUserStore.getState().clearUserDetails();
        useUserStore.getState().setUserDetails({ image: 'only-image.jpg' });
      });
      expect(useUserStore.getState().id).toBeNull();
      expect(useUserStore.getState().name).toBeNull();
      expect(useUserStore.getState().email).toBeNull();
      expect(useUserStore.getState().image).toBe('only-image.jpg');
      expect(useUserStore.getState().role).toBeNull();

      // Test with only role defined
      act(() => {
        useUserStore.getState().clearUserDetails();
        useUserStore.getState().setUserDetails({ role: UserRole.USER });
      });
      expect(useUserStore.getState().id).toBeNull();
      expect(useUserStore.getState().name).toBeNull();
      expect(useUserStore.getState().email).toBeNull();
      expect(useUserStore.getState().image).toBeNull();
      expect(useUserStore.getState().role).toBe(UserRole.USER);
    });
  });

  describe('clearUserDetails', () => {
    it('should reset all user details to null', () => {
      // Set some initial state
      const initialDetails = {
        id: 'user-to-clear',
        name: 'Clear Me',
        email: 'clear@example.com',
        image: 'clear.png',
        role: UserRole.USER,
      };
      act(() => {
        useUserStore.getState().setUserDetails(initialDetails);
      });

      // Verify state is set
      let state = useUserStore.getState();
      expect(state.id).toBe(initialDetails.id);

      // Clear the details
      act(() => {
        useUserStore.getState().clearUserDetails();
      });

      // Verify state is cleared
      state = useUserStore.getState();
      expect(state.id).toBeNull();
      expect(state.name).toBeNull();
      expect(state.email).toBeNull();
      expect(state.image).toBeNull();
      expect(state.role).toBeNull();
    });

    // Test clearUserDetails directly
    it('should clear user details after setting partial state', () => {
      // Set only some fields
      act(() => {
        useUserStore.getState().setUserDetails({
          id: 'partial-id',
          name: 'Partial Name',
          // Leave email, image, and role null
        });
      });

      // Verify partial state
      let state = useUserStore.getState();
      expect(state.id).toBe('partial-id');
      expect(state.name).toBe('Partial Name');
      expect(state.email).toBeNull();
      expect(state.image).toBeNull();
      expect(state.role).toBeNull();

      // Clear the details
      act(() => {
        useUserStore.getState().clearUserDetails();
      });

      // Verify all fields are null
      state = useUserStore.getState();
      expect(state.id).toBeNull();
      expect(state.name).toBeNull();
      expect(state.email).toBeNull();
      expect(state.image).toBeNull();
      expect(state.role).toBeNull();
    });
  });

  // Test store subscription and unsubscription
  describe('store subscription', () => {
    it('should call subscribers when state changes', () => {
      const mockSubscriber = jest.fn();

      // Subscribe to store changes
      const unsubscribe = useUserStore.subscribe(mockSubscriber);

      // Initial state change should trigger subscriber
      act(() => {
        useUserStore.getState().setUserDetails({ name: 'New Name' });
      });

      expect(mockSubscriber).toHaveBeenCalledTimes(1);

      // Another state change should trigger subscriber again
      act(() => {
        useUserStore.getState().setUserDetails({ email: 'new@example.com' });
      });

      expect(mockSubscriber).toHaveBeenCalledTimes(2);

      // Unsubscribe
      unsubscribe();

      // State change after unsubscribe should not trigger subscriber
      act(() => {
        useUserStore.getState().setUserDetails({ id: 'another-id' });
      });

      // Should still be 2 calls
      expect(mockSubscriber).toHaveBeenCalledTimes(2);
    });
  });
});
