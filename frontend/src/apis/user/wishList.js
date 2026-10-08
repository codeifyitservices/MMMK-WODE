import { createUserApiClient } from './client';

const cart = createUserApiClient('/api/v1/user/wish-list', 10000);

export const addItemToWishList = async (data) => {
  const response = await cart.post('/add', data);
  return response.data;
};

export const removeItemFromWishList = async (data) => {
  const response = await cart.post('/remove', data);
  return response.data;
};

export const getWishLists = async (userId) => {
  const response = await cart.get(`/${userId}`);
  return response?.data?.data?.products;
};
