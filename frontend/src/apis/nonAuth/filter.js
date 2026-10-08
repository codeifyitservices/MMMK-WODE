import axios from 'axios';

// Create Axios instance
const filter = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api/v1/filter`,
  timeout: 10000,
  withCredentials: true,
});
// Function to get all filters
export const getFilters = async (params) => {
  const response = await filter.get('/get-all', { params });
  return response.data;
};
