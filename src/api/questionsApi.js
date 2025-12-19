/**
 * Questions API Module
 * Handles question management operations
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { QUESTIONS } = API_ENDPOINTS;

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
 * List questions with pagination and filters
 * @param {Object} [params] - Query parameters
 * @param {number} [params.pageNo=0] - Page number
 * @param {number} [params.pageSize=10] - Page size
 * @param {string} [params.questionType] - Filter by question type
 * @param {string} [params.subjectName] - Filter by subject
 * @param {string} [params.difficulty] - Filter by difficulty
 * @returns {Promise} Response with paginated question list
 */
export const listQuestions = async (params = {}) => {
  const response = await api.get(QUESTIONS.BASE, { params });
  return normalizeResponse(response);
};

/**
 * Create a new question
 * @param {Object} data - Question data
 * @param {string} data.questionType - MCQ_SINGLE, MCQ_MULTI, or NUM
 * @param {string} data.questionText - Question text/content
 * @param {string} [data.subjectName] - Subject name
 * @param {string} [data.difficulty] - easy, medium, or hard
 * @param {number} [data.marks] - Marks for correct answer
 * @param {number} [data.negativeMarks] - Negative marks for wrong answer
 * @param {Array} [data.options] - Options for MCQ questions
 * @param {string} [data.answer] - Answer for numeric questions
 * @returns {Promise} Response with created question
 */
export const createQuestion = async (data) => {
  const response = await api.post(QUESTIONS.BASE, data);
  return normalizeResponse(response);
};

/**
 * Bulk create questions
 * @param {Array} questions - Array of question objects
 * @returns {Promise} Response with created question IDs
 */
export const bulkCreateQuestions = async (questions) => {
  const response = await api.post(QUESTIONS.BULK, { questions });
  return normalizeResponse(response);
};

/**
 * Get question by ID
 * @param {number} id - Question ID
 * @returns {Promise} Response with question details including options
 */
export const getQuestion = async (id) => {
  const response = await api.get(QUESTIONS.GET_BY_ID(id));
  return normalizeResponse(response);
};

/**
 * Update question
 * @param {number} id - Question ID
 * @param {Object} data - Updated question data
 * @returns {Promise} Response with updated question
 */
export const updateQuestion = async (id, data) => {
  const response = await api.put(QUESTIONS.GET_BY_ID(id), data);
  return normalizeResponse(response);
};

/**
 * Delete question
 * @param {number} id - Question ID
 * @returns {Promise} Response confirming deletion
 */
export const deleteQuestion = async (id) => {
  const response = await api.delete(QUESTIONS.GET_BY_ID(id));
  return normalizeResponse(response);
};

export default {
  listQuestions,
  createQuestion,
  bulkCreateQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
