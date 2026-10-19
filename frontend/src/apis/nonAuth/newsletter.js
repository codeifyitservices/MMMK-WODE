import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const newsletterApi = axios.create({
  baseURL: `${backendUrl}/api/v1/newsletter`,
  timeout: 10000,
  withCredentials: true,
});

/**
 * Fetch public popup display configuration
 * @param {object} params - optional query params e.g. { email }
 */
export const getPopupConfig = async (params = {}) => {
  try {
    const response = await newsletterApi.get('/popup-config', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching newsletter popup configuration:', error);
    throw error;
  }
};

/**
 * Check if a subscriber email is active in DB
 */
export const checkSubscriberStatus = async (email) => {
  try {
    const response = await newsletterApi.get('/check-status', {
      params: { email },
    });
    return response.data;
  } catch (error) {
    console.error('Error checking subscriber status:', error);
    return { success: false, isSubscribed: false };
  }
};

/**
 * Subscribe customer email
 * @param {{ email: string, source?: string }} payload
 */
export const subscribeNewsletter = async (payload) => {
  try {
    const response = await newsletterApi.post('/subscribe', payload);
    return response.data;
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    throw error;
  }
};
