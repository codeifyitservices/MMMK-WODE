import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const newsletterApi = axios.create({
  baseURL: `${backendUrl}/api/v1/newsletter`,
  timeout: 10000,
  withCredentials: true,
});

/**
 * Fetch public popup display configuration
 */
export const getPopupConfig = async () => {
  try {
    const response = await newsletterApi.get('/popup-config');
    return response.data;
  } catch (error) {
    console.error('Error fetching newsletter popup configuration:', error);
    throw error;
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
