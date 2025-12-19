/**
 * Authentication API Module
 * Handles login, logout, and profile operations
 */

import api from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/constants';

const { AUTH, ORGANIZATIONS } = API_ENDPOINTS;

/**
 * Check if API response is successful
 * Your backend uses: { data: {...}, result: { responseCode: 200 }, errorFields: null }
 */
const isSuccess = (response) => {
  return response?.result?.responseCode === 200 || response?.success === true;
};

/**
 * Staff login (Admin Portal)
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise} Response with access token
 */
export const login = async (credentials) => {
  const response = await api.post(AUTH.LOGIN, credentials);
  console.log('Login response:', response); // Debug log
  
  if (isSuccess(response) && response.data?.accessToken) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.accessToken);
    return { success: true, data: response.data };
  }
  
  return { 
    success: false, 
    message: response?.errorFields?.[0]?.message || response?.result?.responseDescription || 'Login failed' 
  };
};

/**
 * Examinee login (Student Portal)
 * @param {Object} credentials - Login credentials
 * @param {number} credentials.organizationId - Organization ID
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise} Response with access token
 */
export const loginExaminee = async (credentials) => {
  const response = await api.post(AUTH.LOGIN_EXAMINEE, credentials);
  console.log('Examinee login response:', response); // Debug log
  
  if (isSuccess(response) && response.data?.accessToken) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.accessToken);
    return { success: true, data: response.data };
  }
  
  return { 
    success: false, 
    message: response?.errorFields?.[0]?.message || response?.result?.responseDescription || 'Login failed' 
  };
};

/**
 * Logout - Clear stored auth data
 */
export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  localStorage.removeItem(STORAGE_KEYS.ORGANIZATION);
  window.location.href = '/login';
};

/**
 * Get current user profile
 * @returns {Promise} Response with user profile data
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
 * @param {string} origin - Domain origin (e.g., academy.example.com)
 * @returns {Promise} Response with organization data
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
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload
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
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

/**
 * Get stored access token
 * @returns {string|null} Access token
 */
export const getStoredToken = () => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  const token = getStoredToken();
  return token && !isTokenExpired(token);
};

export default {
  login,
  loginExaminee,
  logout,
  getProfile,
  resolveOrganization,
  decodeToken,
  isTokenExpired,
  getStoredToken,
  isAuthenticated,
};
