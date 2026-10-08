import axios from 'axios';

// Create Axios instance
const support = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/support`,
  timeout: 10000,
  withCredentials: true,
});

export const createSupport = async (data) => {
  const response = await support.post('/create', data);
  return response.data;
};
