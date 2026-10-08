import axios from 'axios';

// Create Axios instance
const category = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/category`,
  timeout: 10000,
  withCredentials: true,
});

export const getAllCategory = async () => {
  const response = await category.get('/all-category');
  return response.data;
};

export const searchCategory = async (query) => {
  const response = await category.get('/search', {
    params: { q: query },
  });
  return response.data?.data;
};
