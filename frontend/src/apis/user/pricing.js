import { createUserApiClient } from './client';

const pricing = createUserApiClient('/api/v1/user/pricing', 10000);

export const getPricingForUser = async () => {
  const response = await pricing.get('/get');
  return response.data;
};
