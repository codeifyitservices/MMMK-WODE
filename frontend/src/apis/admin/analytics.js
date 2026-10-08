import { createAdminApiClient } from './client';

const analyticsApi = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/analytics`
);

/**
 * Get Sales Performance (Most Sold & Highest Revenue on same page)
 */
export const getSalesPerformance = async (params = {}) => {
  try {
    const response = await analyticsApi.get('/sales-performance', { params });
    return response.data?.data;
  } catch (error) {
    console.error('Error fetching sales performance:', error);
    throw error;
  }
};

/**
 * Get View Performance (Most Viewed on dedicated page)
 */
export const getViewPerformance = async (params = {}) => {
  try {
    const response = await analyticsApi.get('/view-performance', { params });
    return response.data?.data;
  } catch (error) {
    console.error('Error fetching view performance:', error);
    throw error;
  }
};

/**
 * Get Analytics Summary
 */
export const getAnalyticsSummary = async (params = {}) => {
  try {
    const response = await analyticsApi.get('/summary', { params });
    return response.data?.data;
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    throw error;
  }
};
