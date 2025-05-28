import { create } from 'zustand';
// import { UserRole } from '@prisma/client'; // Import UserRole if needed
import { UserRole } from '@/types'; // Import from central types definition

/**
 * Global User Store
 * ----------------
 * Purpose: This store is primarily for syncing NextAuth session data for client-side access.
 * It provides a convenient way to access user information across components without
 * having to pass props through the component tree.
 *
 * Usage Guidelines:
 * 1. Use this store ONLY for authentication-related global state that is genuinely needed
 *    throughout the application.
 *
 * 2. For other client-side state, consider the following alternatives first:
 *    - Local component state (useState) for component-specific state
 *    - React Context for state shared across a specific component subtree
 *    - URL state for state that should be reflected in the URL
 *    - Form libraries (like react-hook-form) for form state
 *
 * 3. Only add properties to this store that are:
 *    - Truly global (needed in many unrelated parts of the app)
 *    - Authentication-related or derived from session data
 *    - Changed infrequently (to avoid excessive re-renders)
 *
 * This approach promotes better component isolation, easier testing, and
 * more maintainable code by localizing state to where it's actually needed.
 */

interface UserState {
  id: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole | null; // Add role
  setUserDetails: (details: Partial<UserState>) => void;
  clearUserDetails: () => void;
}

export const useUserStore = create<UserState>(set => ({
  id: null,
  name: null,
  email: null,
  image: null,
  role: null, // Add role initial state
  setUserDetails: details =>
    set(state => ({
      ...state,
      id: details.id !== undefined ? details.id : state.id,
      name: details.name !== undefined ? details.name : state.name,
      email: details.email !== undefined ? details.email : state.email,
      image: details.image !== undefined ? details.image : state.image,
      role: details.role !== undefined ? details.role : state.role,
    })),
  clearUserDetails: () => set({ id: null, name: null, email: null, image: null, role: null }), // Clear role
}));
