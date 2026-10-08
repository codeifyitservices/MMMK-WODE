import { createAdminApiClient } from './client';

const coupon = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/coupon`
);

export const createCoupon = async (data) => {
  try {
    const response = await coupon.post('/create', data);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const updateCoupon = async (id, data) => {
  try {
    const response = await coupon.post(`/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
};

export const getAllCoupon = async (options) => {
  try {
    const response = await coupon.get('/get-all', { params: options });
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const deleteCoupon = async (id) => {
  try {
    const response = await coupon.get(`/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};
