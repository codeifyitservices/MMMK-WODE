import axios from 'axios';

// Create Axios instance
const userAuth = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/user`,
  timeout: 10000,
  withCredentials: true,
});

// Home
export const userLogin = async (data) => {
  const response = await userAuth.post('/login', data);
  return response.data;
};

export const userLogout = async () => {
  const response = await userAuth.get('/logout');
  return response.data;
};

export const userSignup = async (data) => {
  const response = await userAuth.post('/signup', data);
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await userAuth.post('/forgot-password', data);
  return response.data;
};

export const updatePassword = async (token, data) => {
  const response = await userAuth.post(`/update-password/${token}`, data);
  return response.data;
};
