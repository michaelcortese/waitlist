import { create } from 'zustand';
import { waitlist, restaurants } from '../services/api';

const useWaitlistStore = create((set, get) => ({
  currentWaitlist: [],
  isLoading: false,
  error: null,

  fetchWaitlist: async (restaurantId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await restaurants.getWaitlist(restaurantId);
      set({ currentWaitlist: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data || 'Failed to fetch waitlist', isLoading: false });
      return null;
    }
  },

  addToWaitlist: async (restaurantId, entryData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await restaurants.addToWaitlist(restaurantId, entryData);
      const newEntry = response.data;
      set((state) => ({
        currentWaitlist: [...state.currentWaitlist, newEntry],
        isLoading: false,
      }));
      return newEntry;
    } catch (error) {
      set({ error: error.response?.data || 'Failed to add to waitlist', isLoading: false });
      return null;
    }
  },

  updateStatus: async (entryId, status) => {
    set({ isLoading: true, error: null });
    try {
      await waitlist.updateStatus(entryId, status);
      set((state) => ({
        currentWaitlist: state.currentWaitlist.map((entry) =>
          entry.id === entryId ? { ...entry, status } : entry
        ),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data || 'Failed to update status', isLoading: false });
      return false;
    }
  },

  removeEntry: async (entryId) => {
    set({ isLoading: true, error: null });
    try {
      await waitlist.removeEntry(entryId);
      set((state) => ({
        currentWaitlist: state.currentWaitlist.filter((entry) => entry.id !== entryId),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data || 'Failed to remove entry', isLoading: false });
      return false;
    }
  },

  updatePosition: async (entryId, position) => {
    set({ isLoading: true, error: null });
    try {
      await waitlist.updatePosition(entryId, position);
      set((state) => ({
        currentWaitlist: state.currentWaitlist.map((entry) =>
          entry.id === entryId ? { ...entry, position } : entry
        ),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data || 'Failed to update position', isLoading: false });
      return false;
    }
  },

  checkRefundEligibility: async (entryId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await waitlist.checkRefundEligibility(entryId);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data || 'Failed to check refund eligibility', isLoading: false });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useWaitlistStore; 