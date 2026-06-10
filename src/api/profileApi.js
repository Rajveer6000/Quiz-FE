/**
 * Profile API Module
 * Update profile fields and optional avatar via PUT /profile
 */

import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

const { PROFILE } = API_ENDPOINTS;

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
 * Update current user profile (JSON or multipart with optional avatar file)
 * @param {Object} data - firstName, lastName, phone, dob, bio, youtubeUrl, websiteUrl, avatarUrl
 * @param {File} [avatarFile] - Optional image file (field name: avatar)
 */
export const updateProfile = async (data = {}, avatarFile) => {
  if (avatarFile) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    formData.append('avatar', avatarFile);
    const response = await api.put(PROFILE.BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normalizeResponse(response);
  }

  const response = await api.put(PROFILE.BASE, data);
  return normalizeResponse(response);
};

export default {
  updateProfile,
};
