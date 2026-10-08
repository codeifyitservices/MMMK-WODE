import { createUserApiClient } from './client';
import axios from 'axios';

const coupon = createUserApiClient('/api/v1/user/coupon', 30000);

// Non-auth client — used by both guests and logged-in users to apply coupons.
// This avoids the 401 → redirect-to-login problem for guest users.
const checkoutPublic = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/checkout`,
  timeout: 30000,
  withCredentials: true,
});

export const getValidTokens = async () => {
  const response = await coupon.get('/get-valid-token');
  return response.data;
};

export const applyCoupon = async (data) => {
  const response = await checkoutPublic.post('/apply-coupon', data);
  return response.data;
};
