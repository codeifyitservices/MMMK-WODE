import { createAdminApiClient } from './client';

const payment = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/payment`
);

export const createPayment = async (data) => {
  const response = await payment.post('/create', data);
  return response.data;
};

export const getAllPayments = async (options) => {
  const response = await payment.get('/get-all', { params: options });
  return response.data;
};

export const deletePayment = async (id) => {
  const response = await payment.get(`/delete/${id}`);
  return response.data;
};
