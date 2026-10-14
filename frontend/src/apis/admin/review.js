import { createAdminApiClient } from './client';

const review = createAdminApiClient(
  `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/review`
);

export const getAllReview = async (options) => {
  const response = await review.get('/get-all', { params: options });
  return response.data;
};

export const addAdminReview = async (data) => {
  const response = await review.post('/add-review', data);
  return response.data;
};

export const updateAdminReview = async (id, data) => {
  const response = await review.put(`/update-review/${id}`, data);
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await review.delete(`/delete-review/${id}`);
  return response.data;
};

