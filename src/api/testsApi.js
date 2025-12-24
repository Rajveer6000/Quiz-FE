/**
 * Tests API Module
 * Handles test/quiz management operations
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { TESTS } = API_ENDPOINTS;

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
 * List tests with pagination
 * @param {Object} [params] - Query parameters
 * @param {number} [params.pageNo=0] - Page number
 * @param {number} [params.pageSize=10] - Page size
 * @returns {Promise} Response with paginated test list
 */
export const listTests = async (params = {}) => {
  const response = await api.get(TESTS.BASE, { params });
  return normalizeResponse(response);
};

/**
 * Create a new test
 * @param {Object} data - Test data
 * @param {string} data.name - Test name
 * @param {string} [data.description] - Test description
 * @param {number} data.durationMin - Duration in minutes
 * @param {number} [data.templateId] - Template ID for auto sections
 * @param {Array} [data.sections] - Custom sections
 * @returns {Promise} Response with created test
 */
export const createTest = async (data) => {
  const response = await api.post(TESTS.BASE, data);
  return normalizeResponse(response);
};

/**
 * Get test by ID with full details
 * @param {number} id - Test ID
 * @returns {Promise} Response with test details including sections and questions
 */
export const getTest = async (id) => {
  const response = await api.get(TESTS.GET_BY_ID(id));
  return normalizeResponse(response);
};

/**
 * Update test
 * @param {number} id - Test ID
 * @param {Object} data - Updated test data
 * @returns {Promise} Response with updated test
 */
export const updateTest = async (id, data) => {
  const response = await api.put(TESTS.GET_BY_ID(id), data);
  return normalizeResponse(response);
};

/**
 * Delete test
 * @param {number} id - Test ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteTest = async (id) => {
  const response = await api.delete(TESTS.GET_BY_ID(id));
  return normalizeResponse(response);
};

/**
 * Add question to test
 * @param {number} testId - Test ID
 * @param {Object} data - Question data
 * @param {number} data.sectionId - Section ID
 * @param {number} [data.questionId] - Existing question ID
 * @param {Object} [data.question] - New question data
 * @returns {Promise} Response with test question link
 */
export const addQuestionToTest = async (testId, data) => {
  const response = await api.post(TESTS.ADD_QUESTION(testId), data);
  return normalizeResponse(response);
};

/**
 * Finalize test - Makes it available for attempts
 * @param {number} testId - Test ID
 * @returns {Promise} Response confirming finalization
 */
export const finalizeTest = async (testId) => {
  const response = await api.post(TESTS.FINALIZE(testId));
  return normalizeResponse(response);
};

/**
 * Remove question from test
 * @param {number} testId - Test ID
 * @param {number} questionId - Question ID to remove
 * @returns {Promise} Response confirming removal
 */
export const removeQuestionFromTest = async (testId, questionId) => {
  const response = await api.delete(TESTS.REMOVE_QUESTION(testId, questionId));
  return normalizeResponse(response);
};

/**
 * Update question in test
 * @param {number} testId - Test ID
 * @param {number} questionId - Question ID to update
 * @param {Object} data - Updated question data
 * @returns {Promise} Response with updated question
 */
export const updateTestQuestion = async (testId, questionId, data) => {
  const response = await api.put(TESTS.UPDATE_QUESTION(testId, questionId), data);
  return normalizeResponse(response);
};

/**
 * Get test types (JEE, NEET, etc.)
 * @param {Object} [params] - Query parameters
 * @returns {Promise} Response with test types list
 */
export const getTestTypes = async (params = {}) => {
  const response = await api.get('/test-types/types', { params });
  return normalizeResponse(response);
};

/**
 * Get templates by test type
 * @param {number} typeId - Test type ID
 * @param {Object} [params] - Query parameters
 * @returns {Promise} Response with templates list
 */
export const getTemplatesByType = async (typeId, params = {}) => {
  const response = await api.get(`/test-types/${typeId}/templates`, { params });
  return normalizeResponse(response);
};

/**
 * Get template sections
 * @param {number} templateId - Template ID
 * @param {Object} [params] - Query parameters
 * @returns {Promise} Response with template sections
 */
export const getTemplateSections = async (templateId, params = {}) => {
  const response = await api.get(`/test-templates/${templateId}/sections`, { params });
  return normalizeResponse(response);
};

/**
 * Get available tests for examinee (finalized only)
 * @param {Object} [params] - Query parameters
 * @returns {Promise} Response with available tests
 */
export const getAvailableTests = async (params = {}) => {
  const response = await api.get(TESTS.AVAILABLE, { params });
  return normalizeResponse(response);
};

export default {
  listTests,
  createTest,
  getTest,
  updateTest,
  deleteTest,
  addQuestionToTest,
  removeQuestionFromTest,
  updateTestQuestion,
  finalizeTest,
  getTestTypes,
  getTemplatesByType,
  getTemplateSections,
  getAvailableTests,
};
