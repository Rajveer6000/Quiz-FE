/**
 * Examinees API Module
 * Handles examinee management and registration
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { EXAMINEES } = API_ENDPOINTS;

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
 * List examinees with pagination
 * @param {Object} [params] - Query parameters
 * @param {number} [params.pageNo=0] - Page number
 * @param {number} [params.pageSize=10] - Page size
 * @returns {Promise} Response with paginated examinee list
 */
export const listExaminees = async (params = {}) => {
  const response = await api.get(EXAMINEES.BASE, { params });
  return normalizeResponse(response);
};

/**
 * Register a new examinee (self-registration)
 * @param {Object} data - Examinee data
 * @param {number} data.organizationId - Organization ID
 * @param {string} data.email - Email
 * @param {string} data.password - Password
 * @param {string} data.firstName - First name
 * @param {string} data.lastName - Last name
 * @param {string} [data.phone] - Phone number
 * @param {string} [data.dob] - Date of birth (YYYY-MM-DD)
 * @param {string} [data.invitationToken] - Optional invitation token
 * @returns {Promise} Response with created examinee
 */
export const registerExaminee = async (data) => {
  const response = await api.post(EXAMINEES.REGISTER, data);
  return normalizeResponse(response);
};

/**
 * Get examinee by ID
 * @param {number} id - Examinee ID
 * @returns {Promise} Response with examinee details
 */
export const getExaminee = async (id) => {
  const response = await api.get(EXAMINEES.GET_BY_ID(id));
  return normalizeResponse(response);
};

/**
 * Generate invitation token
 * @param {Object} data - Invitation data
 * @param {number} [data.maxUses] - Maximum uses
 * @param {string} [data.validFrom] - Valid from date (ISO)
 * @param {string} [data.validUntil] - Valid until date (ISO)
 * @returns {Promise} Response with invitation token
 */
export const generateInvitation = async (data) => {
  const response = await api.post(EXAMINEES.INVITATIONS, data);
  return normalizeResponse(response);
};

export default {
  listExaminees,
  registerExaminee,
  getExaminee,
  generateInvitation,
};
