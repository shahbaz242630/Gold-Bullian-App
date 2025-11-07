import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setSession: (session) => {
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      logout: () => {
        set({
          session: null,
          user: null,
          isAuthenticated: false,
        });
      },

      initialize: async () => {
        set({ isLoading: true });
        try {
          // Session is restored from AsyncStorage via persist middleware
          const { session } = get();
          if (session) {
            set({ isAuthenticated: true });
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
