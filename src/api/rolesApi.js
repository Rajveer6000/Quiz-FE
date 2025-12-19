/**
 * Roles API Module
 * Handles role management operations
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { ROLES } = API_ENDPOINTS;

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
 * List all roles
 * @returns {Promise} Response with role list
 */
export const listRoles = async () => {
  const response = await api.get(ROLES.BASE);
  // Roles returns paginated data with list property
  if (isSuccess(response)) {
    return { success: true, data: response.data?.list || response.data || [] };
  }
  return { success: false, data: [], message: 'Failed to fetch roles' };
};

/**
 * Create a new role with permissions
 * @param {Object} data - Role data
 * @param {string} data.name - Role name
 * @param {string} [data.description] - Role description
 * @param {Array} data.modules - Module permissions
 * @returns {Promise} Response with created role
 */
export const createRole = async (data) => {
  const response = await api.post(ROLES.BASE, data);
  return normalizeResponse(response);
};

/**
 * Get role by ID
 * @param {number} id - Role ID
 * @returns {Promise} Response with role details
 */
export const getRole = async (id) => {
  const response = await api.get(ROLES.GET_BY_ID(id));
  return normalizeResponse(response);
};

/**
 * Update role
 * @param {number} id - Role ID
 * @param {Object} data - Updated role data
 * @returns {Promise} Response with updated role
 */
export const updateRole = async (id, data) => {
  const response = await api.put(ROLES.GET_BY_ID(id), data);
  return normalizeResponse(response);
};

/**
 * Delete role
 * @param {number} id - Role ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteRole = async (id) => {
  const response = await api.delete(ROLES.GET_BY_ID(id));
  return normalizeResponse(response);
};

export default {
  listRoles,
  createRole,
  getRole,
  updateRole,
  deleteRole,
};
