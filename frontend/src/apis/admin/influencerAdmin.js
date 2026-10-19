import { createAdminApiClient } from './client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const influencerAdmin = createAdminApiClient(
  `${backendUrl}/api/v1/admin/influencers`
);

export const getInfluencerApplicationsAdmin = async (params = {}) => {
  try {
    const response = await influencerAdmin.get('/applications', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching influencer applications:', error);
    throw error;
  }
};

export const approveInfluencerApplicationAdmin = async (id, data = {}) => {
  try {
    const response = await influencerAdmin.post(`/applications/${id}/approve`, data);
    return response.data;
  } catch (error) {
    console.error('Error approving influencer application:', error);
    throw error;
  }
};

export const rejectInfluencerApplicationAdmin = async (id, data = {}) => {
  try {
    const response = await influencerAdmin.post(`/applications/${id}/reject`, data);
    return response.data;
  } catch (error) {
    console.error('Error rejecting influencer application:', error);
    throw error;
  }
};

export const deleteInfluencerApplicationAdmin = async (id) => {
  try {
    const response = await influencerAdmin.delete(`/applications/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting influencer application:', error);
    throw error;
  }
};

export const getInfluencersListAdmin = async (params = {}) => {
  try {
    const response = await influencerAdmin.get('/list', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching influencers list:', error);
    throw error;
  }
};

export const getInfluencerDetailAdmin = async (id) => {
  try {
    const response = await influencerAdmin.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching influencer detail:', error);
    throw error;
  }
};

export const updateInfluencerAdmin = async (id, data) => {
  try {
    const response = await influencerAdmin.put(`/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating influencer:', error);
    throw error;
  }
};

export const getAttributedOrdersAdmin = async (params = {}) => {
  try {
    const response = await influencerAdmin.get('/orders', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching attributed orders:', error);
    throw error;
  }
};

export const getPayoutRequestsAdmin = async (params = {}) => {
  try {
    const response = await influencerAdmin.get('/payouts', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    throw error;
  }
};

export const updatePayoutStatusAdmin = async (id, data) => {
  try {
    const response = await influencerAdmin.put(`/payouts/${id}/status`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating payout status:', error);
    throw error;
  }
};

export const getAffiliateAnalyticsAdmin = async () => {
  try {
    const response = await influencerAdmin.get('/analytics');
    return response.data;
  } catch (error) {
    console.error('Error fetching affiliate analytics:', error);
    throw error;
  }
};
