import { createUserApiClient } from './client';

const tabby = createUserApiClient('/api/v1/user/tabby', 30000);

export const createTabbySession = async (data) => {
  const response = await tabby.post('/create-session', data);
  return response.data;
};

export const refreshTabbyStatus = async (orderId) => {
  const response = await tabby.post(`/refresh-status/${orderId}`);
  return response.data;
};
