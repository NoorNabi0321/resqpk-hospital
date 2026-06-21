import { create } from 'zustand';
import apiClient from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  hospital: null,
  token: localStorage.getItem('resqpk_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.post('/api/auth/hospital/login', { email, password });
      const data = res.data.data;
      localStorage.setItem('resqpk_token', data.token);
      set({
        user: data.user,
        hospital: data.hospital,
        token: data.token,
        isLoading: false,
      });
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('resqpk_token');
    set({ user: null, hospital: null, token: null, error: null });
  },

  // Restores the session on a page refresh.
  checkAuth: async () => {
    const token = localStorage.getItem('resqpk_token');
    if (!token) return;
    try {
      const res = await apiClient.get('/api/auth/me');
      const data = res.data.data;
      set({ user: data, hospital: data.hospital ?? null, token });
    } catch (err) {
      if (err.response?.status === 401) get().logout();
    }
  },
}));

export default useAuthStore;
