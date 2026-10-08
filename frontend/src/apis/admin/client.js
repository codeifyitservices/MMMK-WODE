import axios from 'axios';
import {
  clearStoredAdminAuth,
  getStoredAdminToken,
} from '../../utils/adminAuth';

export const createAdminApiClient = (baseURL, timeout = 10000) => {
  const client = axios.create({
    baseURL,
    timeout,
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    const token = getStoredAdminToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        clearStoredAdminAuth();
        window.location.href = '/admin/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};
