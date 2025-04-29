import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const restaurantService = {
  // Get current waitlist
  async getWaitlist(restaurantId) {
    try {
      const response = await api.get(`/restaurant/${restaurantId}/waitlist`);
      return response.data;
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      throw error;
    }
  },

  // Get restaurant information
  async getRestaurantInfo(restaurantId) {
    try {
      const response = await api.get(`/restaurant/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant info:', error);
      throw error;
    }
  },

  // Join the waitlist
  async joinWaitlist(restaurantId, entry) {
    try {
      const response = await api.post('/waitlist', {
        restaurant_id: restaurantId,
        name: entry.name,
        party_size: entry.partySize,
        phone: entry.phoneNumber,
        notes: entry.notes
      });
      return response.data;
    } catch (error) {
      console.error('Error joining waitlist:', error);
      throw error;
    }
  },

  // Cancel waitlist entry
  async cancelWaitlist(restaurantId, phoneNumber) {
    try {
      const response = await api.post(`/restaurant/${restaurantId}/waitlist/cancel`, { 
        phoneNumber 
      });
      return response.data;
    } catch (error) {
      console.error('Error canceling waitlist:', error);
      throw error;
    }
  },

  // Update waitlist status (admin only)
  async updateWaitlistStatus(entryId, status) {
    try {
      const response = await api.put(`/waitlist/${entryId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating waitlist status:', error);
      throw error;
    }
  },

  // Update restaurant wait time (admin only)
  async updateWaitTime(restaurantId, minutes) {
    try {
      const response = await api.post(`/restaurant/${restaurantId}/update_wait_time`, { wait_time: minutes });
      return response.data;
    } catch (error) {
      console.error('Error updating wait time:', error);
      throw error;
    }
  },

  // Adjust wait time (admin only)
  async adjustWaitTime(restaurantId, adjustment) {
    try {
      const response = await api.post(`/restaurant/${restaurantId}/adjust_wait_time`, { 
        adjustment 
      });
      return response.data;
    } catch (error) {
      console.error('Error adjusting wait time:', error);
      throw error;
    }
  },

  // Remove from waitlist
  async removeFromWaitlist(entryId) {
    try {
      const response = await api.delete(`/waitlist/${entryId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to remove from waitlist');
      }
      return response.data;
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      throw error;
    }
  }
}; 