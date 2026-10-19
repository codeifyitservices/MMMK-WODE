import { jwtDecode } from 'jwt-decode';

const INFLUENCER_TOKEN_KEY = 'mmmk_influencer_token';
const INFLUENCER_PROFILE_KEY = 'mmmk_influencer_profile';

export const getStoredInfluencerToken = () => {
  try {
    return localStorage.getItem(INFLUENCER_TOKEN_KEY) || null;
  } catch {
    return null;
  }
};

export const getStoredInfluencerProfile = () => {
  try {
    const raw = localStorage.getItem(INFLUENCER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredInfluencerAuth = (token, profile) => {
  try {
    if (token) {
      localStorage.setItem(INFLUENCER_TOKEN_KEY, token);
    }
    if (profile) {
      localStorage.setItem(INFLUENCER_PROFILE_KEY, JSON.stringify(profile));
    }
  } catch (err) {
    console.error('Failed to store influencer auth:', err);
  }
};

export const clearStoredInfluencerAuth = () => {
  try {
    localStorage.removeItem(INFLUENCER_TOKEN_KEY);
    localStorage.removeItem(INFLUENCER_PROFILE_KEY);
  } catch (err) {
    console.error('Failed to clear influencer auth:', err);
  }
};

export const isStoredInfluencerTokenValid = () => {
  const token = getStoredInfluencerToken();
  if (!token) return false;

  try {
    const { exp } = jwtDecode(token);
    return Boolean(exp) && Date.now() < exp * 1000;
  } catch {
    return false;
  }
};
