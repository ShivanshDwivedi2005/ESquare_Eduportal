import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';
import { mockUsers } from '@/mock-data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  onboarded: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  setUser: (user: User) => void;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      onboarded: false,
      login: (role) => set({ user: mockUsers[role] ?? mockUsers.student, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, onboarded: false }),
      setUser: (user) => set({ user }),
      completeOnboarding: () => set({ onboarded: true }),
    }),
    { name: 'esquare-auth' },
  ),
);
