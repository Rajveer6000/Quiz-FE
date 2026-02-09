/**
 * Groups API Module
 * Handles group management operations
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { GROUPS } = API_ENDPOINTS;

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
 * List all groups with pagination
 * @param {number} pageNo - Page number (0-indexed)
 * @param {number} pageSize - Items per page
 * @returns {Promise} Response with paginated group list
 */
export const listGroups = async (pageNo = 0, pageSize = 10) => {
    const response = await api.get(`${GROUPS.BASE}?pageNo=${pageNo}&pageSize=${pageSize}`);
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
    return { success: false, data: [], message: 'Failed to fetch groups' };
};

/**
 * Create a new group
 * @param {Object} data - Group data
 * @param {string} data.name - Group name
 * @param {string} [data.description] - Group description
 * @param {Array<string>} data.emails - Member emails
 * @returns {Promise} Response with created group or invalidEmails on error
 */
export const createGroup = async (data) => {
    try {
        const response = await api.post(GROUPS.BASE, data);
        console.log('Create Group API Response:', response);

        // Handle specific error for admin/user emails that can't be added
        // The API interceptor returns response.data, so response is already the data object
        if (response?.result?.responseCode === 100152) {
            console.log('Invalid emails detected:', response.data);
            return {
                success: false,
                message: response.result.responseDescription,
                invalidEmails: response.data || [], // List of invalid emails
            };
        }

        return normalizeResponse(response);
    } catch (error) {
        console.log('Create Group API Error:', error);
        // Error might come from axios interceptor with the response data
        if (error?.result?.responseCode === 100152) {
            console.log('Invalid emails from error:', error.data);
            return {
                success: false,
                message: error.result.responseDescription,
                invalidEmails: error.data || [],
            };
        }
        return { success: false, message: error?.result?.responseDescription || error?.message || 'Failed to create group' };
    }
};

/**
 * Get group by ID with members
 * @param {number} id - Group ID
 * @returns {Promise} Response with group details and members
 */
export const getGroup = async (id) => {
    const response = await api.get(GROUPS.GET_BY_ID(id));
    return normalizeResponse(response);
};

/**
 * Delete group (soft delete)
 * @param {number} id - Group ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteGroup = async (id) => {
    const response = await api.delete(GROUPS.GET_BY_ID(id));
    return normalizeResponse(response);
};

/**
 * Extract emails from uploaded Excel file
 * @param {File} file - Excel file
 * @returns {Promise} Response with array of emails
 */
export const extractEmailsFromFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(GROUPS.EXTRACT_EMAILS, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    if (isSuccess(response)) {
        return { success: true, data: response.data || [] };
    }
    return { success: false, data: [], message: 'Failed to extract emails from file' };
};

export default {
    listGroups,
    createGroup,
    getGroup,
    deleteGroup,
    extractEmailsFromFile,
};
