/**
 * Dashboard API Module
 * Handles examinee dashboard stats and analytics
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { DASHBOARD } = API_ENDPOINTS;

/**
 * Check if API response is successful
 */
const isSuccess = (response) => {
  const code = response?.result?.responseCode;
  return code === 200 || code === 201 || response?.success === true;
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
 * Get examinee dashboard stats
 * @returns {Promise} Response with stats like testsCompleted, averageScore, etc.
 */
export const getExamineeStats = async () => {
  const response = await api.get(DASHBOARD.EXAMINEE_STATS);
  return normalizeResponse(response);
};

/**
 * Get examinee performance graph data
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} [params.groupBy='day'] - Grouping: 'day', 'week', or 'month'
 * @param {number} [params.testId] - Optional test ID to filter by
 * @returns {Promise} Response with timeline and testBreakdown data
 */
export const getExamineeGraph = async (params = {}) => {
  const response = await api.get(DASHBOARD.EXAMINEE_GRAPH, { params });
  return normalizeResponse(response);
};

/**
 * Get paused tests for examinee
 * @param {Object} [params] - Query parameters
 * @param {number} [params.limit=50] - Number of records to return
 * @param {number} [params.offset=0] - Offset for pagination
 * @returns {Promise} Response with pausedTests array and pagination
 */
export const getPausedTests = async (params = {}) => {
  const response = await api.get(DASHBOARD.PAUSED_TESTS, { params });
  return normalizeResponse(response);
};

export default {
  getExamineeStats,
  getExamineeGraph,
  getPausedTests,
};
