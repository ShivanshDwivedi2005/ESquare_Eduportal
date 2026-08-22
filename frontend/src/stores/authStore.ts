import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/services/auth';
import type { User } from '@/types';

interface SignupInput {
  displayName: string;
  username: string;
  email: string;
  password: string;
  verificationToken: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  initialized: boolean;
  onboarded: boolean;
  initialize: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<User>;
  signup: (input: SignupInput) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      initialized: false,
      onboarded: false,

      initialize: async () => {
        if (get().initialized) return;
        try {
          const user = await authApi.restore();
          set({ user, isAuthenticated: true, initialized: true });
        } catch {
          set({ user: null, isAuthenticated: false, initialized: true });
        }
      },

      login: async (identifier, password) => {
        const user = await authApi.login(identifier, password);
        set({ user, isAuthenticated: true, initialized: true });
        return user;
      },

      signup: async (input) => {
        const user = await authApi.signup(input);
        set({ user, isAuthenticated: true, initialized: true, onboarded: false });
        return user;
      },

      logout: async () => {
        await authApi.logout();
        set({ user: null, isAuthenticated: false, initialized: true, onboarded: false });
      },

      setUser: (user) => set({ user }),
      completeOnboarding: () => set({ onboarded: true }),
    }),
    {
      name: 'esquare-auth',
      partialize: (state) => ({ user: state.user, onboarded: state.onboarded }),
    },
  ),
);

if (typeof window !== 'undefined') {
  window.addEventListener('esquare:session-ended', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, initialized: true });
  });
}
