import { createUserApiClient } from './client';

const review = createUserApiClient('/api/v1/user/review', 3000);

export const addReview = async (data) => {
  const response = await review.post('/add', data);
  return response.data;
};

export const getReviewEligibility = async (productId) => {
  const response = await review.get(`/eligibility/${productId}`);
  return response.data;
};
