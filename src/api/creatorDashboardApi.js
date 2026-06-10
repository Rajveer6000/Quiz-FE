/**
 * Creator Dashboard API Module
 * Staff/creator analytics and overview
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { DASHBOARD } = API_ENDPOINTS;

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
 * Single bundled request for entire creator dashboard (preferred — 1 HTTP call)
 */
export const getCreatorOverview = async (params = {}) => {
  const response = await api.get(DASHBOARD.CREATOR_OVERVIEW, { params });
  return normalizeResponse(response);
};

export const getCreatorSummary = async (params = {}) => {
  const response = await api.get(DASHBOARD.CREATOR_SUMMARY, { params });
  return normalizeResponse(response);
};

export const getCreatorRevenue = async (params = {}) => {
  const response = await api.get(DASHBOARD.CREATOR_REVENUE, { params });
  return normalizeResponse(response);
};

export const getCreatorNewStudents = async (params = {}) => {
  const response = await api.get(DASHBOARD.CREATOR_NEW_STUDENTS, { params });
  return normalizeResponse(response);
};

export const getCreatorTestsPerformance = async (params = {}) => {
  const response = await api.get(DASHBOARD.CREATOR_TESTS_PERFORMANCE, { params });
  return normalizeResponse(response);
};

export const getCreatorCategoriesDistribution = async (params = {}) => {
  const response = await api.get(DASHBOARD.CREATOR_CATEGORIES, { params });
  return normalizeResponse(response);
};

export const getCreatorTopTests = async (params = {}) => {
  const response = await api.get(DASHBOARD.CREATOR_TOP_TESTS, { params });
  return normalizeResponse(response);
};

export const getCreatorRecentPurchases = async (params = {}) => {
  const response = await api.get(DASHBOARD.CREATOR_RECENT_PURCHASES, { params });
  return normalizeResponse(response);
};

export default {
  getCreatorOverview,
  getCreatorSummary,
  getCreatorRevenue,
  getCreatorNewStudents,
  getCreatorTestsPerformance,
  getCreatorCategoriesDistribution,
  getCreatorTopTests,
  getCreatorRecentPurchases,
};
