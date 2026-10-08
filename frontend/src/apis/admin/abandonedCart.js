import { createAdminApiClient } from './client';

const abandonedCartApi = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/abandoned-cart`
);

export const getAllAbandonedCarts = async (options = {}) => {
  try {
    const response = await abandonedCartApi.get('/', { params: options });
    return response.data;
  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
    throw error;
  }
};

export const getAbandonedCartStats = async () => {
  try {
    const response = await abandonedCartApi.get('/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching abandoned cart stats:', error);
    throw error;
  }
};

export const getAbandonedCartDetail = async (id) => {
  try {
    const response = await abandonedCartApi.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching abandoned cart detail:', error);
    throw error;
  }
};
