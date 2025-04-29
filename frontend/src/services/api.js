import axios from 'axios';

// API base URL - backend server runs on port 8080
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making request to:', config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response from:', response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  }
};

// Restaurant services
export const restaurantService = {
  create: async (restaurantData) => {
    const response = await api.post('/restaurant', restaurantData);
    return response.data;
  },
  
  getRestaurant: async (restaurantId) => {
    try {
      const response = await api.get(`/restaurant/${restaurantId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      throw error;
    }
  },
  
  updateWaitTime: async (restaurantId, waitTime) => {
    const response = await api.post(`/restaurant/${restaurantId}/update_wait_time`, { wait_time: waitTime });
    return response.data;
  },
  
  getWaitlist: async (restaurantId) => {
    try {
      const response = await api.get(`/restaurant/${restaurantId}/waitlist`);
      return response.data;
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      throw error;
    }
  },
  
  updateWaitlistStatus: async (waitlistId, status) => {
    try {
      const response = await api.post(`/waitlist/${waitlistId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating waitlist status:', error);
      throw error;
    }
  },
  
  removeFromWaitlist: async (waitlistId) => {
    try {
      const response = await api.delete(`/waitlist/${waitlistId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      throw error;
    }
  }
};

// Waitlist services
export const waitlistService = {
  addToWaitlist: async (restaurantId, waitlistData) => {
    try {
      const response = await api.post(`/restaurant/${restaurantId}/waitlist`, waitlistData);
      console.log('Waitlist response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      throw error;
    }
  },
  
  getWaitlist: async (restaurantId) => {
    const response = await api.get(`/restaurant/${restaurantId}/waitlist`);
    return response.data;
  },
  
  updateStatus: async (waitlistId, status) => {
    const response = await api.post(`/waitlist/${waitlistId}/status`, status);
    return response.data;
  },
  
  removeFromWaitlist: async (waitlistId) => {
    const response = await api.delete(`/waitlist/${waitlistId}`);
    return response.data;
  },
  
  updatePosition: async (waitlistId, position) => {
    const response = await api.put(`/waitlist/${waitlistId}/position`, { position });
    return response.data;
  }
};

export default api; 