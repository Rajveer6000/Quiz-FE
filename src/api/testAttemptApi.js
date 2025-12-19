/**
 * Test Attempts API Module
 * Handles test taking and attempt management
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { TEST_ATTEMPTS } = API_ENDPOINTS;

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
 * Start a new test attempt
 * @param {number} testId - Test ID to attempt
 * @returns {Promise} Response with new attempt ID and initial state
 */
export const startAttempt = async (testId) => {
  const response = await api.post(TEST_ATTEMPTS.START, { testId });
  return normalizeResponse(response);
};

/**
 * Get current attempt state
 * @param {number} attemptId - Attempt ID
 * @returns {Promise} Response with full attempt state
 */
export const getAttemptState = async (attemptId) => {
  const response = await api.get(TEST_ATTEMPTS.GET_STATE(attemptId));
  return normalizeResponse(response);
};

/**
 * Save answer for a question
 * @param {number} attemptId - Attempt ID
 * @param {Object} data - Answer data
 * @param {number} data.testQuestionId - Test Question ID
 * @param {number} [data.selectedOptionId] - Selected option ID (MCQ)
 * @param {Array} [data.selectedOptionIds] - Selected option IDs (Multi)
 * @param {string} [data.selectedAnswer] - Answer (Numeric)
 * @param {number} [data.timeSpentSec] - Time spent on question
 * @returns {Promise} Response confirming save
 */
export const saveAnswer = async (attemptId, data) => {
  const response = await api.post(TEST_ATTEMPTS.SAVE_ANSWER(attemptId), data);
  return normalizeResponse(response);
};

/**
 * Mark question for review
 * @param {number} attemptId - Attempt ID
 * @param {Object} data - Review data
 * @param {number} data.testQuestionId - Test Question ID
 * @param {boolean} data.isReviewed - Review status
 * @returns {Promise} Response confirming mark
 */
export const markForReview = async (attemptId, data) => {
  const response = await api.post(TEST_ATTEMPTS.MARK_REVIEW(attemptId), data);
  return normalizeResponse(response);
};

/**
 * Track navigation between questions
 * @param {number} attemptId - Attempt ID
 * @param {Object} data - Navigation data
 * @param {number} data.fromQuestionId - From question ID
 * @param {number} data.toQuestionId - To question ID
 * @param {number} [data.timeSpentSec] - Time spent on from question
 * @returns {Promise} Response confirming navigation log
 */
export const navigate = async (attemptId, data) => {
  const response = await api.post(TEST_ATTEMPTS.NAVIGATE(attemptId), data);
  return normalizeResponse(response);
};

/**
 * Pause attempt
 * @param {number} attemptId - Attempt ID
 * @returns {Promise} Response confirming pause
 */
export const pauseAttempt = async (attemptId) => {
  const response = await api.post(TEST_ATTEMPTS.PAUSE(attemptId));
  return normalizeResponse(response);
};

/**
 * Resume attempt
 * @param {number} attemptId - Attempt ID
 * @returns {Promise} Response with updated attempt state
 */
export const resumeAttempt = async (attemptId) => {
  const response = await api.post(TEST_ATTEMPTS.RESUME(attemptId));
  return normalizeResponse(response);
};

/**
 * Submit attempt
 * @param {number} attemptId - Attempt ID
 * @param {string} [submissionType='manual'] - Submission type
 * @returns {Promise} Response confirming submission
 */
export const submitAttempt = async (attemptId, submissionType = 'manual') => {
  const response = await api.post(TEST_ATTEMPTS.SUBMIT(attemptId), { submissionType });
  return normalizeResponse(response);
};

/**
 * Get attempt result
 * @param {number} attemptId - Attempt ID
 * @returns {Promise} Response with result details
 */
export const getResult = async (attemptId) => {
  const response = await api.get(TEST_ATTEMPTS.RESULT(attemptId));
  return normalizeResponse(response);
};

/**
 * Get attempt history
 * @param {Object} [params] - Query parameters
 * @param {number} [params.pageNo=0] - Page number
 * @param {number} [params.pageSize=10] - Page size
 * @returns {Promise} Response with paginated attempt history
 */
export const getAttemptHistory = async (params = {}) => {
  const response = await api.get(TEST_ATTEMPTS.HISTORY, { params });
  return normalizeResponse(response);
};

/**
 * Log window event (focus, blur, tab switch)
 * @param {number} attemptId - Attempt ID
 * @param {Object} data - Event data
 * @param {string} data.eventType - Event type
 * @param {number} [data.lastQuestionId] - Question ID when event occurred
 * @returns {Promise} Response confirming log
 */
export const logWindowEvent = async (attemptId, data) => {
  try {
    const response = await api.post(TEST_ATTEMPTS.WINDOW_EVENT(attemptId), data);
    return normalizeResponse(response);
  } catch (error) {
    // Silently fail for window events
    return { success: false };
  }
};

export default {
  startAttempt,
  getAttemptState,
  saveAnswer,
  markForReview,
  navigate,
  pauseAttempt,
  resumeAttempt,
  submitAttempt,
  getResult,
  getAttemptHistory,
  logWindowEvent,
};
