import { create } from 'zustand';
import { api } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  // Login action
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

  // Signup action
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

  // Logout action
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Fetch current user (restores session)
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
    } catch (err) {
      // 401 error or other issue, clear token
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

  // Helper to clear errors
  clearError: () => set({ error: null }),
}));
