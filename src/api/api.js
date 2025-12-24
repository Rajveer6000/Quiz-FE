/**
 * Axios API Instance
 * Configured with base URL, authentication interceptors, and auto token refresh
 */

import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS, API_ENDPOINTS } from '../constants/constants';
import { getLoadingCallbacks } from '../context/LoadingContext';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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

// Response interceptor - Handle errors, auto refresh, and stop loading
api.interceptors.response.use(
  (response) => {
    getLoadingCallbacks().stop();
    return response.data;
  },
  async (error) => {
    getLoadingCallbacks().stop();
    
    const originalRequest = error.config;
    
    // Handle 401 - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry/redirect for login endpoints (invalid credentials)
      if (originalRequest.url?.includes('/login')) {
        return Promise.reject(error);
      }

      // Don't retry refresh endpoints
      if (originalRequest.url?.includes('/refresh')) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshTokenValue = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshTokenValue) {
        isRefreshing = false;
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Determine which refresh endpoint to use
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        const isExaminee = userData && JSON.parse(userData)?.isExaminee;
        const refreshEndpoint = isExaminee 
          ? API_ENDPOINTS.AUTH.REFRESH_EXAMINEE 
          : API_ENDPOINTS.AUTH.REFRESH;

        const response = await axios.post(
          `${API_BASE_URL}${refreshEndpoint}`,
          { refreshToken: refreshTokenValue },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken } = response.data?.data || {};
        
        if (accessToken) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
          if (refreshToken) {
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          }
          
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error cases
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 403:
          console.error('Access denied:', data?.message);
          break;
        case 404:
          console.error('Resource not found:', data?.message);
          break;
        case 500:
          console.error('Server error:', data?.message);
          break;
        default:
          console.error('API Error:', data?.message || error.message);
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
