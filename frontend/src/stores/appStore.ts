import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  savedPosts: string[];
  likedPosts: string[];
  savedOpportunities: string[];
  appliedOpportunities: string[];
  registeredHackathons: string[];
  joinRequests: string[];
  followedEntities: string[];
  readNotifications: string[];
  toggle: (key: keyof Pick<AppState, 'savedPosts' | 'likedPosts' | 'savedOpportunities' | 'followedEntities'>, id: string) => void;
  add: (key: keyof Pick<AppState, 'appliedOpportunities' | 'registeredHackathons' | 'joinRequests' | 'readNotifications'>, id: string) => void;
  markAllRead: (ids: string[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      savedPosts: [], likedPosts: [], savedOpportunities: [], appliedOpportunities: [],
      registeredHackathons: [], joinRequests: [], followedEntities: [], readNotifications: [],
      toggle: (key, id) =>
        set((s) => ({
          [key]: s[key].includes(id) ? s[key].filter((x) => x !== id) : [...s[key], id],
        }) as Partial<AppState>),
      add: (key, id) => set((s) => (s[key].includes(id) ? {} : ({ [key]: [...s[key], id] } as Partial<AppState>))),
      markAllRead: (ids) => set({ readNotifications: ids }),
    }),
    { name: 'esquare-app' },
  ),
);
