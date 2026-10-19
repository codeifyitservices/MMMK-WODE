import { createAdminApiClient } from './client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const newsletterAdmin = createAdminApiClient(
  `${backendUrl}/api/v1/admin/newsletter`
);

/**
 * Fetch paginated subscriber list
 */
export const getSubscribersAdmin = async (params = {}) => {
  try {
    const response = await newsletterAdmin.get('/subscribers', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    throw error;
  }
};

/**
 * Export subscribers to CSV file
 */
export const exportSubscribersCsvAdmin = async (params = {}) => {
  try {
    const response = await newsletterAdmin.get('/subscribers/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting subscribers:', error);
    throw error;
  }
};

/**
 * Delete a subscriber
 */
export const deleteSubscriberAdmin = async (id) => {
  try {
    const response = await newsletterAdmin.delete(`/subscribers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    throw error;
  }
};

/**
 * Update subscriber status (subscribed/unsubscribed)
 */
export const updateSubscriberStatusAdmin = async (id, status) => {
  try {
    const response = await newsletterAdmin.patch(`/subscribers/${id}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating subscriber status:', error);
    throw error;
  }
};

/**
 * Fetch existing store coupons for selection
 */
export const getAvailableCouponsAdmin = async () => {
  try {
    const response = await newsletterAdmin.get('/available-coupons');
    return response.data;
  } catch (error) {
    console.error('Error fetching available coupons:', error);
    throw error;
  }
};

/**
 * Fetch popup configuration for Admin
 */
export const getPopupSettingsAdmin = async () => {
  try {
    const response = await newsletterAdmin.get('/popup-settings');
    return response.data;
  } catch (error) {
    console.error('Error fetching popup settings:', error);
    throw error;
  }
};

/**
 * Update popup configuration
 */
export const updatePopupSettingsAdmin = async (data) => {
  try {
    const response = await newsletterAdmin.put('/popup-settings', data);
    return response.data;
  } catch (error) {
    console.error('Error updating popup settings:', error);
    throw error;
  }
};
