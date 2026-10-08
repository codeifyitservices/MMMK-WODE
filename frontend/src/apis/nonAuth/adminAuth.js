import axios from 'axios';

// Create Axios instance
const adminAuth = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin`,
  timeout: 10000,
  withCredentials: true,
});

// Home
export const adminLogin = async (data) => {
  const response = await adminAuth.post('/login', data);
  return response.data;
};

export const adminLogout = async () => {
  const response = await adminAuth.get('/logout');
  return response.data;
};

export const adminForgotPassword = async (data) => {
  const response = await adminAuth.post('/forgot-password', data);
  return response.data;
};

export const adminResetPassword = async (token, data) => {
  const response = await adminAuth.post(`/reset-password/${token}`, data);
  return response.data;
};
