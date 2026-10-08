import axios from 'axios';

// Create Axios instance
const userAuth = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/review`,
  timeout: 10000,
  withCredentials: true,
});

export const getReviewsByProduct = async (id) => {
  const response = await userAuth.get(`get-by-product/${id}`);
  return response.data;
};
