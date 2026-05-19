import { create } from 'zustand';
import type { JWTPayload } from '@/types/auth';
import { authService } from '@services/AuthService';

interface AuthState {
  session: JWTPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setSession: (payload: JWTPayload) => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: (session) => set({ session, isAuthenticated: true }),

  logout: async () => {
    await authService.logout();
    set({ session: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const payload = await authService.restoreSession();
      if (payload) {
        set({ session: payload, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
