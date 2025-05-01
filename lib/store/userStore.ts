import { create } from 'zustand';
// import { UserRole } from '@prisma/client'; // Import UserRole if needed
import { UserRole } from '@/types'; // Import from central types definition

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
