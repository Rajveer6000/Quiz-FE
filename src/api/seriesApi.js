import api from './api';

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

const seriesApi = {
  // Get all series (admin)
  getSeriesList: async (params = {}) => {
    const response = await api.get('/series/admin', { params });
    return normalizeResponse(response);
  },

  // Create a new series
  createSeries: async (data) => {
    const response = await api.post('/series/admin', data);
    return normalizeResponse(response);
  },

  // Get series details by ID
  getSeriesDetails: async (id) => {
    const response = await api.get(`/series/admin/${id}`);
    return normalizeResponse(response);
  },

  // Update series details
  updateSeries: async (id, data) => {
    const response = await api.patch(`/series/admin/${id}`, data);
    return normalizeResponse(response);
  },

  // Add tests to a series
  addTestsToSeries: async (id, data) => {
    const response = await api.post(`/series/admin/${id}/tests`, data);
    return normalizeResponse(response);
  },

  // Remove a test from a series
  removeTestFromSeries: async (id, testId) => {
    const response = await api.delete(`/series/admin/${id}/tests/${testId}`);
    return normalizeResponse(response);
  },

  // Reorder tests in a series
  reorderTestsInSeries: async (id, orderedTestIds) => {
    const response = await api.put(`/series/admin/${id}/tests/reorder`, { orderedTestIds });
    return normalizeResponse(response);
  },

  // Publish a series
  publishSeries: async (id) => {
    const response = await api.post(`/series/admin/${id}/publish`);
    return normalizeResponse(response);
  },

  // Examinee: list published series
  getSeriesCatalog: async (params = {}) => {
    const response = await api.get('/series', {
      params: {
        page: params.page ?? params.pageNo ?? 0,
        limit: params.limit ?? params.pageSize ?? 10,
        search: params.search,
        status: params.status
      }
    });
    return normalizeResponse(response);
  },

  // Examinee: get series details
  getSeriesDetailsPublic: async (id) => {
    const response = await api.get(`/series/${id}`);
    return normalizeResponse(response);
  }
};

export default seriesApi;
