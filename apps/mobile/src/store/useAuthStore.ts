import { create } from 'zustand';
import { api } from '../services/api';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: any, token: string) => void;
  logout: () => void;
  updateUser: (user: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    set({ user, token, isAuthenticated: true });
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    delete api.defaults.headers.common['Authorization'];
  },

  updateUser: (user) => set({ user }),
}));
