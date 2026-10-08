import { createAdminApiClient } from './client';

const dash = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/dashboard`
);

export const getDashboardData = async (filters) => {
  try {
    const response = await dash.get('/get', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
