import { createAdminApiClient } from './client';

const order = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/order`
);

export const createOrder = async (data) => {
  try {
    const response = await order.post('/create', data);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const updateOrder = async (id, data) => {
  try {
    const response = await order.post(`/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getAll = async (options) => {
  try {
    const response = await order.get(`/get-all`, { params: options });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getSingle = async (id) => {
  try {
    const response = await order.get(`/get-single/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const deleteOrder = async (id) => {
  try {
    const response = await order.get(`/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const processReturnExchange = async (orderId, requestId, data) => {
  try {
    const response = await order.post(
      `/process-return-exchange/${orderId}/${requestId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error processing return/exchange request:', error);
    throw error;
  }
};

export const checkJuraStatus = async (orderId) => {
  try {
    const response = await order.get(`/check-jura-status/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error syncing tracking status:', error);
    throw error;
  }
};
