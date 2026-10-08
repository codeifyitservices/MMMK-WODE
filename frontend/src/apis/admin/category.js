import { createAdminApiClient } from './client';

const cat = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/category`
);

export const addCategory = async (data) => {
  try {
    const response = await cat.post('/add', data);
    return response.data;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const getAllCategories = async (filters) => {
  try {
    const response = await cat.get('/get-all', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const editCategory = async (id, data) => {
  try {
    const response = await cat.post(`/edit/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error editing category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await cat.get(`/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

/**
 * Persists drag-and-drop order to the database.
 * @param {{id: string, order: number}[]} orderedItems - Array of category ids with persisted order values
 */
export const reorderCategories = async (orderedItems) => {
  try {
    const response = await cat.post(
      '/reorder',
      { orderedItems },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error reordering categories:', error);
    throw error;
  }
};
