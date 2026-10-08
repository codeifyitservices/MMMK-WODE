import { createUserApiClient } from './client';

const order = createUserApiClient('/api/v1/user/order', 30000);
const guestOrder = createUserApiClient('/api/v1/order', 30000);

export const createManualOrder = async (data) => {
  const response = await order.post('/create', data);
  return response.data;
};

export const createGuestOrder = async (data) => {
  const response = await guestOrder.post('/create-guest', data);
  return response.data;
};

export const getOrders = async (options) => {
  const response = await order.get('/get-user-orders', { params: options });
  return response.data;
};

export const requestReturnExchange = async (orderId, data) => {
  const response = await order.post(`/request-return-exchange/${orderId}`, data);
  return response.data;
};

const checkoutPublic = createUserApiClient('/api/v1/checkout', 30000);
export const getOrderByIdPublic = async (orderId) => {
  const response = await checkoutPublic.get(`/order/${orderId}`);
  return response.data;
};
