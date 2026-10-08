import { createAdminApiClient } from './client';

const product = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/product`,
  120000
);

export const createProduct = async (data) => {
  try {
    const response = await product.post('/create', data);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getAllProducts = async (options) => {
  try {
    
    const response = await product.get('/get-all', { params: options });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getSingleProducts = async (id) => {
  try {
    const response = await product.get(`/get-single/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const updateProduct = async (id, data) => {
  try {
    const response = await product.post(`/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await product.post(`/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const reorderProducts = async (orderedItems, options = {}) => {
  try {
    const response = await product.post(
      '/reorder',
      { orderedItems, ...options },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error reordering products:', error);
    throw error;
  }
};
