/**
 * Test Formats API Module
 * Exam types and templates from public schema (SQL seed)
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { TESTS } = API_ENDPOINTS;

const isSuccess = (response) => {
  const code = response?.result?.responseCode;
  return code === 200 || code === 201 || response?.success === true;
};

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
 * List all exam formats with nested templates
 */
export const listTestFormats = async () => {
  const response = await api.get(TESTS.FORMATS);
  return normalizeResponse(response);
};

export default {
  listTestFormats,
};
