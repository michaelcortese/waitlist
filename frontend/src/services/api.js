import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8080', // Default backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
    const response = await api.post('/restaurants', restaurantData);
    return response.data;
  },
  
  updateWaitTime: async (restaurantId, waitTime) => {
    const response = await api.put(`/restaurants/${restaurantId}/wait-time`, { wait_time: waitTime });
    return response.data;
  }
};

// Waitlist services
export const waitlistService = {
  addToWaitlist: async (restaurantId, waitlistData) => {
    const response = await api.post(`/restaurants/${restaurantId}/waitlist`, waitlistData);
    return response.data;
  },
  
  getWaitlist: async (restaurantId) => {
    const response = await api.get(`/restaurants/${restaurantId}/waitlist`);
    return response.data;
  },
  
  updateStatus: async (waitlistId, status) => {
    const response = await api.put(`/waitlist/${waitlistId}/status`, status);
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