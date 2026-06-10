/**
 * Students API Module
 * Richer student/examinee list and detail with purchases & attempts
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { STUDENTS } = API_ENDPOINTS;

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
 * List students with pagination and search
 * @param {Object} [params] - pageNo, pageSize, search, sortOrder
 */
export const listStudents = async (params = {}) => {
  const response = await api.get(STUDENTS.BASE, { params });
  return normalizeResponse(response);
};

/**
 * Get student detail by examinee id
 * @param {number} id - Examinee/student id
 */
export const getStudent = async (id) => {
  const response = await api.get(STUDENTS.GET_BY_ID(id));
  return normalizeResponse(response);
};

export default {
  listStudents,
  getStudent,
};
