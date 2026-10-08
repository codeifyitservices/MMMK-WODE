import { createUserApiClient } from './client';

const cart = createUserApiClient('/api/v1/user/cart', 10000);

export const addCartItem = async (data) => {
  const response = await cart.post('/add-item', data);
  return response.data;
};

export const getCartItems = async () => {
  const response = await cart.get(`/get-cart-item`);
  return response.data;
};

export const setCartData = async (data) => {
  const response = await cart.post('/set-cart-items', data);
  return response.data;
};

export const removeCartItems = async (id, sku, quantity = 0) => {
  const response = await cart.get(
    `/remove-cart-item/${id}?sku=${sku}&quantity=${quantity}`
  );
  return response.data;
};
