/**
 * Question Types API Module
 * Handles fetching available question types
 */

import api from './api';

const BASE_URL = '/question-types';

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
 * List question types
 * @param {Object} [params] - Query parameters
 * @param {number} [params.pageNo=0] - Page number
 * @param {number} [params.pageSize=10] - Page size
 * @returns {Promise} Response with question types list
 */
export const listQuestionTypes = async (params = {}) => {
  const response = await api.get(BASE_URL, { 
    params: { 
      pageNo: 0, 
      pageSize: 50, 
      sortOrder: 'ASC',
      ...params 
    } 
  });
  return normalizeResponse(response);
};

export default {
  listQuestionTypes,
};
