/**
 * Axios API Instance
 * Configured with base URL and authentication interceptors
 */

import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/constants';
import { getLoadingCallbacks } from '../context/LoadingContext';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token and trigger loading
api.interceptors.request.use(
  (config) => {
    // Start global loading
    getLoadingCallbacks().start();
    
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    getLoadingCallbacks().stop();
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors and stop loading
api.interceptors.response.use(
  (response) => {
    getLoadingCallbacks().stop();
    return response.data;
  },
  (error) => {
    getLoadingCallbacks().stop();
    
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Access denied:', data.message);
          break;
        case 404:
          console.error('Resource not found:', data.message);
          break;
        case 500:
          console.error('Server error:', data.message);
          break;
        default:
          console.error('API Error:', data.message || error.message);
      }

      return Promise.reject(data || error);
    }

    // Network error or timeout
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
