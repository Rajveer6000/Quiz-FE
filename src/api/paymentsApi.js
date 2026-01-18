/**
 * Payments API Module
 * Handles Razorpay payment integration
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { PAYMENTS } = API_ENDPOINTS;

/**
 * Check if API response is successful
 */
const isSuccess = (response) => {
  const code = response?.result?.responseCode;
  return code === 200 || code === 201 || response?.success === true;
};

/**
 * Create a Razorpay order for purchasing an entity
 * @param {string} entityType - Type of entity (e.g., 'TEST')
 * @param {number} entityId - ID of the entity to purchase
 * @returns {Promise} Response with order details including razorpayOrderId, razorpayKeyId, amount
 */
export const createOrder = async (entityType, entityId) => {
  try {
    const response = await api.post(PAYMENTS.CREATE_ORDER, { entityType, entityId });
    if (isSuccess(response)) {
      return {
        success: true,
        data: response.data,
        message: response.result?.responseDescription || 'Order created successfully'
      };
    }
    return {
      success: false,
      message: response.result?.responseDescription || response.message || 'Failed to create order'
    };
  } catch (error) {
    console.error('Create order error:', error);
    return { 
      success: false, 
      message: error.result?.responseDescription || error.message || 'Failed to create payment order' 
    };
  }
};

/**
 * Get Razorpay payment configuration
 * @returns {Promise} Response with payment config (keyId, currency, name, description)
 */
export const getPaymentConfig = async () => {
  try {
    const response = await api.get(PAYMENTS.CONFIG);
    if (isSuccess(response)) {
      return {
        success: true,
        data: response.data
      };
    }
    return {
      success: false,
      message: response.result?.responseDescription || 'Failed to get payment config'
    };
  } catch (error) {
    console.error('Get payment config error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Verify Razorpay payment after successful checkout
 * @param {string} razorpayOrderId - Razorpay order ID
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} razorpaySignature - Razorpay signature for verification
 * @returns {Promise} Response with verification status
 */
export const verifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const response = await api.post(PAYMENTS.VERIFY, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });
    if (isSuccess(response)) {
      return {
        success: true,
        data: response.data,
        message: response.result?.responseDescription || 'Payment verified successfully'
      };
    }
    return {
      success: false,
      message: response.result?.responseDescription || 'Payment verification failed'
    };
  } catch (error) {
    console.error('Verify payment error:', error);
    return { 
      success: false, 
      message: error.result?.responseDescription || error.message || 'Payment verification failed' 
    };
  }
};

export default {
  createOrder,
  getPaymentConfig,
  verifyPayment,
};
