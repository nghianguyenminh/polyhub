import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  gender?: boolean;
  birthday?: string;
  major?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  role?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  isTransitioning: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
  setTransitioning: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  loading: true,
  isTransitioning: false,

  login: async (token, user) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, loading: false });
    } catch (e) {
      console.error('Failed to save login session:', e);
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false, loading: false });
    } catch (e) {
      console.error('Failed to clear login session:', e);
    }
  },

  updateUser: async (updatedFields) => {
    const { user } = get();
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (e) {
      console.error('Failed to update user session:', e);
    }
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        set({
          token,
          user: JSON.parse(userStr),
          isAuthenticated: true,
          loading: false,
        });
      } else {
        set({ token: null, user: null, isAuthenticated: false, loading: false });
      }
    } catch (e) {
      console.error('Failed to restore auth session:', e);
      set({ token: null, user: null, isAuthenticated: false, loading: false });
    }
  },

  setTransitioning: (val) => set({ isTransitioning: val }),
}));
