import { createAdminApiClient } from './client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const seoAdmin = createAdminApiClient(`${backendUrl}/api/v1/admin/seo-settings`);

export const getSeoSettingsAdmin = async () => {
  try {
    const response = await seoAdmin.get('/');
    return response.data;
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    throw error;
  }
};

export const updateSeoSettingsAdmin = async (payload) => {
  try {
    const response = await seoAdmin.patch('/', payload);
    return response.data;
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    throw error;
  }
};

export const generateSeoSchemaAdmin = async (payload) => {
  try {
    const response = await seoAdmin.post('/generate-schema', payload);
    return response.data;
  } catch (error) {
    console.error('Error generating global schema:', error);
    throw error;
  }
};

