/**
 * Authentication API Module
 * Handles login, logout, refresh, and profile operations
 */

import api from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/constants';

const { AUTH, ORGANIZATIONS } = API_ENDPOINTS;

/**
 * Check if API response is successful
 */
const isSuccess = (response) => {
  const code = response?.result?.responseCode;
  return code === 200 || code === 201 || response?.success === true;
};

/**
 * Store tokens in localStorage
 */
const storeTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
};

/**
 * Staff login (Admin Portal)
 */
export const login = async (credentials) => {
  const response = await api.post(AUTH.LOGIN, credentials);
  
  if (isSuccess(response) && response.data?.accessToken) {
    storeTokens(response.data.accessToken, response.data.refreshToken);
    return { success: true, data: response.data };
  }
  
  return { 
    success: false, 
    message: response?.errorFields?.[0]?.message || response?.result?.responseDescription || 'Login failed' 
  };
};

/**
 * Examinee login (Student Portal)
 */
export const loginExaminee = async (credentials) => {
  const response = await api.post(AUTH.LOGIN_EXAMINEE, credentials);
  
  if (isSuccess(response) && response.data?.accessToken) {
    storeTokens(response.data.accessToken, response.data.refreshToken);
    return { success: true, data: response.data };
  }
  
  return { 
    success: false, 
    message: response?.errorFields?.[0]?.message || response?.result?.responseDescription || 'Login failed' 
  };
};

/**
 * Refresh access token using refresh token (staff)
 */
export const refreshToken = async () => {
  const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!storedRefreshToken) {
    return { success: false, message: 'No refresh token' };
  }

  try {
    const response = await api.post(AUTH.REFRESH, { refreshToken: storedRefreshToken });
    
    if (isSuccess(response) && response.data?.accessToken) {
      storeTokens(response.data.accessToken, response.data.refreshToken);
      return { success: true, data: response.data };
    }
    
    return { success: false, message: 'Token refresh failed' };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Refresh access token using refresh token (examinee)
 */
export const refreshExamineeToken = async () => {
  const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!storedRefreshToken) {
    return { success: false, message: 'No refresh token' };
  }

  try {
    const response = await api.post(AUTH.REFRESH_EXAMINEE, { refreshToken: storedRefreshToken });
    
    if (isSuccess(response) && response.data?.accessToken) {
      storeTokens(response.data.accessToken, response.data.refreshToken);
      return { success: true, data: response.data };
    }
    
    return { success: false, message: 'Token refresh failed' };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Logout - Clear stored auth data
 */
export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  localStorage.removeItem(STORAGE_KEYS.ORGANIZATION);
  window.location.href = '/login';
};

/**
 * Get current user profile
 */
export const getProfile = async () => {
  try {
    const response = await api.get(AUTH.PROFILE);
    if (isSuccess(response)) {
      return { success: true, data: response.data };
    }
    return { success: false, message: 'Failed to get profile' };
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Resolve organization by domain/origin
 */
export const resolveOrganization = async (origin) => {
  try {
    const response = await api.get(ORGANIZATIONS.RESOLVE, { params: { origin } });
    if (isSuccess(response)) {
      return { success: true, data: response.data };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Decode JWT token to extract user info
 */
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  // Add 30 second buffer to refresh before actual expiry
  return decoded.exp * 1000 < Date.now() + 30000;
};

/**
 * Get stored access token
 */
export const getStoredToken = () => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Get stored refresh token
 */
export const getStoredRefreshToken = () => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getStoredToken();
  return token && !isTokenExpired(token);
};

export default {
  login,
  loginExaminee,
  logout,
  refreshToken,
  refreshExamineeToken,
  getProfile,
  resolveOrganization,
  decodeToken,
  isTokenExpired,
  getStoredToken,
  getStoredRefreshToken,
  isAuthenticated,
};
