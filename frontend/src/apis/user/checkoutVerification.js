import axios from 'axios';

const checkoutVerification = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/checkout`,
  timeout: 30000,
  withCredentials: true,
});

const getCheckoutVerificationToken = () =>
  sessionStorage.getItem('checkoutVerificationToken') || '';

export const setCheckoutVerificationToken = (token) => {
  if (token) {
    sessionStorage.setItem('checkoutVerificationToken', token);
  }
};

export const clearCheckoutVerificationToken = () => {
  sessionStorage.removeItem('checkoutVerificationToken');
};

checkoutVerification.interceptors.request.use((config) => {
  const token = getCheckoutVerificationToken();
  if (token) {
    config.headers['X-Checkout-Verification'] = token;
  }
  return config;
});

export const sendCheckoutOtp = async (email) => {
  const response = await checkoutVerification.post('/send-otp', { email });
  return response.data;
};

export const verifyCheckoutOtp = async ({ email, otp }) => {
  const response = await checkoutVerification.post('/verify-otp', { email, otp });
  if (response.data?.token) {
    setCheckoutVerificationToken(response.data.token);
  }
  return response.data;
};

export const getVerifiedCheckoutAddresses = async () => {
  const response = await checkoutVerification.get('/addresses');
  return response.data;
};

export const saveVerifiedCheckoutAddresses = async (data) => {
  const response = await checkoutVerification.put('/addresses', data);
  return response.data;
};

export const createVerifiedGuestOrder = async (data) => {
  const response = await checkoutVerification.post('/create-guest', data);
  return response.data;
};

export const createVerifiedGuestPaymentIntent = async (data) => {
  const response = await checkoutVerification.post('/create-payment-intent', data);
  return response.data;
};
