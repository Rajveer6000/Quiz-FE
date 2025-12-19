/**
 * Organizations API Module
 * Handles organization operations
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { ORGANIZATIONS } = API_ENDPOINTS;

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
 * List organizations (public - for student login/registration)
 * @param {Object} [params] - Query parameters
 * @param {number} [params.pageNo=0] - Page number
 * @param {number} [params.pageSize=100] - Page size
 * @returns {Promise} Response with organization list
 */
export const listOrganizations = async (params = {}) => {
  const response = await api.get(ORGANIZATIONS.BASE, { 
    params: { 
      pageNo: 0, 
      pageSize: 100, 
      sortOrder: 'ASC',
      ...params 
    } 
  });
  return normalizeResponse(response);
};

/**
 * Create a new organization (self-registration)
 * @param {Object} data - Organization data
 * @param {string} data.name - Organization name
 * @param {string} data.slug - URL slug
 * @param {string} data.adminEmail - Admin email
 * @param {string} data.adminPassword - Admin password
 * @param {string} data.adminFirstName - Admin first name
 * @param {string} data.adminLastName - Admin last name
 * @returns {Promise} Response with created organization
 */
export const createOrganization = async (data) => {
  const response = await api.post(ORGANIZATIONS.BASE, data);
  return normalizeResponse(response);
};

/**
 * Get organization by ID
 * @param {number} id - Organization ID
 * @returns {Promise} Response with organization details
 */
export const getOrganization = async (id) => {
  const response = await api.get(ORGANIZATIONS.GET_BY_ID(id));
  return normalizeResponse(response);
};

/**
 * Update organization
 * @param {number} id - Organization ID
 * @param {Object} data - Updated organization data
 * @returns {Promise} Response with updated organization
 */
export const updateOrganization = async (id, data) => {
  const response = await api.put(ORGANIZATIONS.GET_BY_ID(id), data);
  return normalizeResponse(response);
};

/**
 * Get organization modules
 * @returns {Promise} Response with enabled modules
 */
export const getOrganizationModules = async () => {
  const response = await api.get(ORGANIZATIONS.MODULES);
  return normalizeResponse(response);
};

/**
 * Resolve organization by domain
 * @param {string} origin - Domain origin
 * @returns {Promise} Response with organization data
 */
export const resolveOrganization = async (origin) => {
  try {
    const response = await api.get(ORGANIZATIONS.RESOLVE, { params: { origin } });
    return normalizeResponse(response);
  } catch (error) {
    return { success: false };
  }
};

export default {
  listOrganizations,
  createOrganization,
  getOrganization,
  updateOrganization,
  getOrganizationModules,
  resolveOrganization,
};
