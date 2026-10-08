import { createAdminApiClient } from './client';

const filter = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/filter`
);

export const createFilter = async (data) => {
  const response = await filter.post('/create', data);
  return response.data;
};

export const getAllFilters = async (options) => {
  const response = await filter.get('/get-all', { params: options });
  return response.data;
};

export const updateFilter = async (id, data) => {
  const response = await filter.post(`/update/${id}`, data);
  return response.data;
};

export const deleteFilter = async (id) => {
  const response = await filter.get(`/delete/${id}`);
  return response.data;
};
