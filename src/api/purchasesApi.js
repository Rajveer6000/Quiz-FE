/**
 * Purchases API Module
 * Handles test purchases and access checks
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { PURCHASES } = API_ENDPOINTS;

/**
 * Check if API response is successful
 */
const isSuccess = (response) => {
  const code = response?.result?.responseCode;
  return code === 200 || code === 201 || response?.success === true;
};

/**
 * Purchase a test
 * @param {number} testId 
 */
export const purchaseTest = async (testId) => {
  try {
    const response = await api.post(PURCHASES.BASE, { testId });
    if (isSuccess(response)) {
      return { 
        success: true, 
        data: response.data,
        message: response.result?.responseDescription || 'Test purchased successfully'
      };
    }
    return { 
      success: false, 
      message: response.result?.responseDescription || response.message || 'Purchase failed' 
    };
  } catch (error) {
    console.error('Purchase error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get my purchases
 */
export const getMyPurchases = async () => {
  try {
    const response = await api.get(PURCHASES.ME);
    if (isSuccess(response)) {
      return { success: true, data: response.data };
    }
    return { success: false, message: 'Failed to fetch purchases' };
  } catch (error) {
    console.error('Get purchases error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Check access to a test
 * @param {number} testId 
 */
export const checkAccess = async (testId) => {
  try {
    const response = await api.get(PURCHASES.CHECK_ACCESS(testId));
    if (isSuccess(response)) {
      return { success: true, hasAccess: true, data: response.data };
    }
    return { success: true, hasAccess: false };
  } catch (error) {
    console.error('Check access error:', error);
    return { success: false, message: error.message };
  }
};

export default {
  purchaseTest,
  getMyPurchases,
  checkAccess,
};
