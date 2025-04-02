import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
};

// Restaurant endpoints
export const restaurants = {
  create: (data) => api.post('/restaurant', data),
  updateWaitTime: (id, data) => api.post(`/restaurant/${id}/update_wait_time`, data),
  getWaitlist: (id) => api.get(`/restaurant/${id}/waitlist`),
  addToWaitlist: (id, data) => api.post(`/restaurant/${id}/waitlist`, data),
};

// Waitlist endpoints
export const waitlist = {
  updateStatus: (id, status) => api.post(`/waitlist/${id}/status`, { status }),
  removeEntry: (id) => api.delete(`/waitlist/${id}`),
  updatePosition: (id, position) => api.put(`/waitlist/${id}/position`, { position }),
  checkRefundEligibility: (id) => api.get(`/waitlist/${id}/refund-eligibility`),
};

// Subscription endpoints
export const subscriptions = {
  create: (data) => api.post('/subscription', data),
};

// Payment endpoints
export const payments = {
  process: (data) => api.post('/payment', data),
};

// Notification endpoints
export const notifications = {
  send: (data) => api.post('/notification', data),
};

export default api; 