/**
 * Users API Module
 * Handles user management operations
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { USERS } = API_ENDPOINTS;

/**
 * Check if API response is successful
 */
const isSuccess = (response) => {
  return response?.result?.responseCode === 200 || response?.success === true;
};

/**
 * Normalize API response to standard format
 */
const normalizeResponse = (response) => {
  if (isSuccess(response)) {
    return { success: true, data: response.data };
  }
  return { 
    success: false, 
    message: response?.errorFields?.[0]?.message || response?.result?.responseDescription || 'Request failed' 
  };
};

/**
 * List users with pagination
 * @param {Object} [params] - Query parameters
 * @param {number} [params.pageNo=0] - Page number
 * @param {number} [params.pageSize=10] - Page size
 * @returns {Promise} Response with paginated user list
 */
export const listUsers = async (params = {}) => {
  const response = await api.get(USERS.BASE, { params });
  return normalizeResponse(response);
};

/**
 * Create a new user
 * @param {Object} data - User data
 * @param {string} data.email - User email
 * @param {string} data.password - User password
 * @param {string} data.firstName - First name
 * @param {string} data.lastName - Last name
 * @param {string} [data.phone] - Phone number
 * @param {number} data.roleId - Role ID
 * @returns {Promise} Response with created user
 */
export const createUser = async (data) => {
  const response = await api.post(USERS.BASE, data);
  return normalizeResponse(response);
};

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Promise} Response with user details
 */
export const getUser = async (id) => {
  const response = await api.get(USERS.GET_BY_ID(id));
  return normalizeResponse(response);
};

/**
 * Update user
 * @param {number} id - User ID
 * @param {Object} data - Updated user data
 * @returns {Promise} Response with updated user
 */
export const updateUser = async (id, data) => {
  const response = await api.put(USERS.GET_BY_ID(id), data);
  return normalizeResponse(response);
};

/**
 * Delete user
 * @param {number} id - User ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteUser = async (id) => {
  const response = await api.delete(USERS.GET_BY_ID(id));
  return normalizeResponse(response);
};

/**
 * Reset user password (self only)
 * @param {number} id - User ID
 * @param {Object} data - Password data
 * @param {string} data.oldPassword - Current password
 * @param {string} data.newPassword - New password
 * @returns {Promise} Response confirming password reset
 */
export const resetPassword = async (id, data) => {
  const response = await api.post(USERS.RESET_PASSWORD(id), data);
  return normalizeResponse(response);
};

export default {
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  resetPassword,
};
