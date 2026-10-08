import axios from 'axios';
import {
  clearStoredUserAuth,
  getStoredUserToken,
  isStoredUserTokenExpired,
} from '../../utils/authStorage';

const logAuthDebug = (error, token) => {
  const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
  const url =
    error.config?.url && error.config?.baseURL
      ? `${error.config.baseURL}${error.config.url}`
      : error.config?.url || 'UNKNOWN_URL';

  console.error('[user-api-auth-debug]', {
    method,
    url,
    status: error.response?.status,
    responseMessage: error.response?.data?.message || error.message,
    hasBearerToken: Boolean(token),
    tokenExpiredOnClient: isStoredUserTokenExpired(),
    backendBaseUrl: import.meta.env.VITE_BACKEND_URL,
  });
};

export const createUserApiClient = (basePath, timeout = 10000) => {
  const client = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}${basePath}`,
    timeout,
    withCredentials: true,
  });

  client.interceptors.request.use((config) => {
    const token = getStoredUserToken();
    if (token && !isStoredUserTokenExpired()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Prevent caching for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: new Date().getTime(),
      };
    }
    
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const token = getStoredUserToken();

      if (error.response?.status === 401) {
        logAuthDebug(error, token);
      }

      if (error.response?.status === 401 && isStoredUserTokenExpired()) {
        clearStoredUserAuth();
        window.location.href = '/auth';
      }
      return Promise.reject(error);
    }
  );

  return client;
};
