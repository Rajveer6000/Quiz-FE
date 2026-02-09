/**
 * Allocations API Module
 * Handles bulk allocation operations for tests/series
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { ALLOCATIONS, GROUPS } = API_ENDPOINTS;

/**
 * Check if API response is successful
 */
const isSuccess = (response) => {
    const code = response?.result?.responseCode;
    return code === 200 || code === 201 || response?.success === true;
};

/**
 * Initiate a bulk allocation
 * @param {Object} data - Allocation data
 * @param {string} data.entityType - Type of entity ('TEST' or 'SERIES')
 * @param {number} data.entityId - ID of the entity to allocate
 * @param {Array<string>} [data.emails] - List of emails (when not using group)
 * @param {number} [data.groupId] - Existing group ID (when using group)
 * @param {boolean} [data.createGroup] - Whether to create a new group from emails
 * @param {string} [data.groupName] - Name for new group (required if createGroup is true)
 * @param {string} [data.groupDescription] - Description for new group
 * @returns {Promise} Response with allocation details and Razorpay order info
 */
export const initiateAllocation = async (data) => {
    try {
        const response = await api.post(ALLOCATIONS.BASE, data);

        if (isSuccess(response)) {
            return {
                success: true,
                data: response.data,
                message: response.result?.responseDescription || 'Allocation initiated successfully'
            };
        }

        return {
            success: false,
            message: response.result?.responseDescription || 'Failed to initiate allocation',
            invalidEmails: response.data || [],
        };
    } catch (error) {
        console.error('Initiate allocation error:', error);
        // Handle specific error for admin/user emails
        if (error?.result?.responseCode === 100152) {
            return {
                success: false,
                message: error.result.responseDescription,
                invalidEmails: error.data || [],
            };
        }
        return {
            success: false,
            message: error?.result?.responseDescription || error?.message || 'Failed to initiate allocation'
        };
    }
};

/**
 * List all allocations with pagination
 * @param {number} pageNo - Page number (0-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Promise} Response with paginated allocation list
 */
export const listAllocations = async (pageNo = 0, pageSize = 10) => {
    try {
        const response = await api.get(`${ALLOCATIONS.BASE}?pageNo=${pageNo}&pageSize=${pageSize}`);

        if (isSuccess(response)) {
            return {
                success: true,
                data: response.data?.list || [],
                pagination: {
                    totalPages: response.data?.totalPages || 0,
                    pageNo: response.data?.pageNo || 0,
                    pageSize: response.data?.pageSize || pageSize,
                    totalRecords: response.data?.totalRecords || 0,
                }
            };
        }
        return { success: false, data: [], message: 'Failed to fetch allocations' };
    } catch (error) {
        console.error('List allocations error:', error);
        return { success: false, data: [], message: error?.message || 'Failed to fetch allocations' };
    }
};

/**
 * Get allocation by ID with members
 * @param {number} id - Allocation ID
 * @returns {Promise} Response with allocation details and members
 */
export const getAllocation = async (id) => {
    try {
        const response = await api.get(ALLOCATIONS.GET_BY_ID(id));

        if (isSuccess(response)) {
            return { success: true, data: response.data };
        }
        return {
            success: false,
            message: response.result?.responseDescription || 'Failed to fetch allocation'
        };
    } catch (error) {
        console.error('Get allocation error:', error);
        return { success: false, message: error?.message || 'Failed to fetch allocation' };
    }
};

/**
 * Verify allocation payment after Razorpay checkout
 * @param {Object} data - Payment verification data
 * @param {number} data.allocationId - Allocation ID
 * @param {string} data.razorpayOrderId - Razorpay order ID
 * @param {string} data.razorpayPaymentId - Razorpay payment ID
 * @param {string} data.razorpaySignature - Razorpay signature
 * @returns {Promise} Response with verification status
 */
export const verifyAllocationPayment = async (data) => {
    try {
        const response = await api.post(ALLOCATIONS.VERIFY, data);

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
        console.error('Verify allocation payment error:', error);
        return {
            success: false,
            message: error?.result?.responseDescription || error?.message || 'Payment verification failed'
        };
    }
};

/**
 * Extract emails from uploaded Excel file (reusing groups endpoint)
 * @param {File} file - Excel file
 * @returns {Promise} Response with array of emails
 */
export const extractEmailsFromFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await api.post(GROUPS.EXTRACT_EMAILS, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (isSuccess(response)) {
            return { success: true, data: response.data || [] };
        }
        return { success: false, data: [], message: 'Failed to extract emails from file' };
    } catch (error) {
        console.error('Extract emails error:', error);
        return { success: false, data: [], message: error?.message || 'Failed to extract emails' };
    }
};

/**
 * Reprocess an existing allocation (retry failed items)
 * @param {number} id - Allocation ID
 * @returns {Promise} Response with allocation details
 */
export const processAllocation = async (id) => {
    try {
        const response = await api.post(`${ALLOCATIONS.BASE}/${id}/process`);

        if (isSuccess(response)) {
            return {
                success: true,
                data: response.data,
                message: response.result?.responseDescription || 'Allocation processing started'
            };
        }
        return {
            success: false,
            message: response.result?.responseDescription || 'Failed to process allocation'
        };
    } catch (error) {
        console.error('Process allocation error:', error);
        return {
            success: false,
            message: error?.result?.responseDescription || error?.message || 'Failed to process allocation'
        };
    }
};

export default {
    initiateAllocation,
    listAllocations,
    getAllocation,
    verifyAllocationPayment,
    extractEmailsFromFile,
    processAllocation,
};
