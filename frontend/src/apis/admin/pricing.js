import { createAdminApiClient } from './client';

const pricing = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/pricing`
);

export const updatePricing = async (data) => {
  const response = await pricing.post('/update', data);
  return response.data;
};

export const getPricing = async () => {
  const response = await pricing.get('/get');
  return response.data;
};
