import axios from 'axios';
import {
  getStoredInfluencerToken,
  isStoredInfluencerTokenValid,
  clearStoredInfluencerAuth,
} from '../../utils/influencerAuth';

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/v1/influencer`;

export const influencerClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

// Attach Authorization Bearer token to every request
influencerClient.interceptors.request.use((config) => {
  const token = getStoredInfluencerToken();
  if (token && isStoredInfluencerTokenValid()) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Prevent caching on GET requests
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
  }

  return config;
});

// Handle 401 unauthorized gracefully
influencerClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredInfluencerAuth();
      if (!window.location.pathname.includes('/influencer/login')) {
        window.location.href = '/influencer/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// API Helper Functions
// ==========================================

export const loginInfluencerApi = async (identifier, password) => {
  const response = await influencerClient.post('/login', { identifier, password });
  return response.data;
};

export const getInfluencerProfileApi = async () => {
  const response = await influencerClient.get('/profile');
  return response.data;
};

export const updateInfluencerProfileApi = async (payload) => {
  const response = await influencerClient.put('/profile', payload);
  return response.data;
};

export const changeInfluencerPasswordApi = async (currentPassword, newPassword) => {
  const response = await influencerClient.put('/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const getInfluencerDashboardStatsApi = async () => {
  const response = await influencerClient.get('/dashboard');
  return response.data;
};

export const getInfluencerOrdersApi = async (params = {}) => {
  const response = await influencerClient.get('/orders', { params });
  return response.data;
};

export const getInfluencerProductsApi = async (params = {}) => {
  const response = await influencerClient.get('/products', { params });
  return response.data;
};

export const requestPayoutApi = async (payload) => {
  const response = await influencerClient.post('/payout/request', payload);
  return response.data;
};

export const getPayoutHistoryApi = async () => {
  const response = await influencerClient.get('/payout/history');
  return response.data;
};
