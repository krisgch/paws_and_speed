import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../types/supabase.ts';

interface AuthStore {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}));

export default useAuthStore;
