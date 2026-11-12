import { createAdminApiClient } from './client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const pagesAdmin = createAdminApiClient(`${backendUrl}/api/v1/admin/pages`);

export const getAllPagesAdmin = async (params = {}) => {
  try {
    const response = await pagesAdmin.get('/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching pages:', error);
    throw error;
  }
};

export const getPageByIdAdmin = async (id) => {
  try {
    const response = await pagesAdmin.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching page:', error);
    throw error;
  }
};

export const createPageAdmin = async (payload) => {
  try {
    const response = await pagesAdmin.post('/', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating page:', error);
    throw error;
  }
};

export const updatePageAdmin = async (id, payload) => {
  try {
    const response = await pagesAdmin.patch(`/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating page:', error);
    throw error;
  }
};

export const deletePageAdmin = async (id) => {
  try {
    const response = await pagesAdmin.delete(`/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting page:', error);
    throw error;
  }
};

export const generatePageSchemaAdmin = async (payload) => {
  try {
    const response = await pagesAdmin.post('/generate-schema', payload);
    return response.data;
  } catch (error) {
    console.error('Error generating page schema:', error);
    throw error;
  }
};

