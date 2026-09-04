import { create } from 'zustand';
import { User } from '@/types';
import { saveAuth, clearAuth, getUser, getToken } from './auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  setAuth: (token, user) => {
    saveAuth(token, user);
    set({ user, token });
  },
  logout: () => {
    clearAuth();
    set({ user: null, token: null });
  },
  hydrate: () => {
    const user = getUser();
    const token = getToken();
    set({ user, token, isHydrated: true });
  },
}));
