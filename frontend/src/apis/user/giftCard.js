import { createUserApiClient } from './client';

const card = createUserApiClient('/api/v1/user/gift-card', 30000);

export const applyGiftCard = async (code, password, currency, currencyRate) => {
  const response = await card.post('/add-gift-card', { code, password, currency, currencyRate });
  return response.data;
};

export const getCreatedGiftCards = async (params) => {
  const response = await card.get('/created-gift-cards', { params });
  return response.data;
};

export const createGiftCard = async (data) => {
  const response = await card.post('/create-gift-card', data);
  return response.data;
};

export const shareGiftCard = async (giftCardId, data) => {
  const response = await card.post(`/share/${giftCardId}`, data);
  return response.data;
};
