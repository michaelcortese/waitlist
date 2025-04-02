import { create } from 'zustand';
import { auth } from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await auth.login(credentials);
      const { token } = response.data;
      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data || 'Login failed', isLoading: false });
      return false;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      await auth.register(userData);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data || 'Registration failed', isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore; 