import { jwtDecode } from 'jwt-decode';

const ADMIN_STORAGE_KEY = 'adminAuthToken';

export const getStoredAdminAuth = () => {
  try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const getStoredAdminToken = () => getStoredAdminAuth()?.token || null;

export const clearStoredAdminAuth = () => {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
};

export const isStoredAdminTokenValid = () => {
  const token = getStoredAdminToken();
  if (!token) return false;

  try {
    const { exp } = jwtDecode(token);
    return Boolean(exp) && Date.now() < exp * 1000;
  } catch {
    return false;
  }
};
