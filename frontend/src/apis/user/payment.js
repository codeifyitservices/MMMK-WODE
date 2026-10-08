import { createUserApiClient } from './client';

const payment = createUserApiClient('/api/v1/user/payment', 30000);
const tabby = createUserApiClient('/api/v1/user/tabby', 30000);

export const createPaymentIntent = async (data) => {
  const response = await payment.post('/create-payment-intent', data);
  return response.data;
};

export const refreshPaymentStatus = async (orderId) => {
  const response = await payment.post(`/refresh-status/${orderId}`);
  return response.data;
};

export const createTabbySession = async (data) => {
  const response = await tabby.post('/create-session', data);
  return response.data;
};

export const refreshTabbyStatus = async (orderId) => {
  const response = await tabby.post(`/refresh-status/${orderId}`);
  return response.data;
};

const checkoutPublic = createUserApiClient('/api/v1/checkout', 30000);

export const refreshPaymentStatusPublic = async (orderId) => {
  const response = await checkoutPublic.post(`/refresh-payment/${orderId}`);
  return response.data;
};

export const refreshTabbyStatusPublic = async (orderId) => {
  const response = await checkoutPublic.post(`/refresh-tabby/${orderId}`);
  return response.data;
};

export const getDeliveryFee = async (data) => {
  const response = await checkoutPublic.post('/delivery-fee', data);
  return response.data;
};

export const confirmApplePayPayment = async (data) => {
  const response = await checkoutPublic.post('/apple-pay-checkout', data);
  return response.data;
};


