import { create } from 'zustand';
import { api } from '../services/api';

// TODO(security): Migrate JWT storage from localStorage to HttpOnly SameSite cookies when backend cookie auth is enabled.
export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    } catch (err) {
      set({ error: err.message || 'Login failed', loading: false });
      return false;
    }
  },

  signup: async (userData) => {
    set({ loading: true, error: null });
    try {
      const data = await api.post('/auth/signup', userData);
      localStorage.setItem('token', data.token);
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        loading: false,
      });
      return true;
    } catch (err) {
      set({ error: err.message || 'Signup failed', loading: false });
      return false;
    }
  },

  updateProfile: async (profileData) => {
    set({ error: null });
    const data = await api.post('/user/profile', profileData);
    if (data && data.user) {
      set({ user: data.user });
    }
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  fetchUser: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      const data = await api.get('/auth/me');
      set({
        user: data.user,
        isAuthenticated: true,
        loading: false,
      });
    } catch {
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: 'Session expired. Please log in again.',
      });
    }
  },

  clearError: () => set({ error: null }),
}));
