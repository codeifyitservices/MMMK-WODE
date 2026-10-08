import { createAdminApiClient } from './client';

const giftCard = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/giftCard`,
  2000
);

// functions
export const createGiftcard = async (data) => {
  const response = await giftCard.post('/add', data);
  return response.data;
};

export const updateGiftCard = async (id, data) => {
  const response = await giftCard.post(`/update/${id}`, data);
  return response.data;
};

export const deleteGiftCard = async (id) => {
  const response = await giftCard.post(`/delete/${id}`);
  return response.data;
};

export const getAllGiftCards = async (options) => {
  const response = await giftCard.get(`/get-all`, { params: options });
  return response.data;
};
