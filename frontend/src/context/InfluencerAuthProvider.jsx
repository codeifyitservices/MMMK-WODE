/* eslint-disable react/prop-types */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStoredInfluencerToken,
  getStoredInfluencerProfile,
  setStoredInfluencerAuth,
  clearStoredInfluencerAuth,
  isStoredInfluencerTokenValid,
} from '../utils/influencerAuth';
import {
  loginInfluencerApi,
  getInfluencerProfileApi,
  updateInfluencerProfileApi,
} from '../apis/influencer/client';

const InfluencerAuthContext = createContext(null);

export const InfluencerAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredInfluencerToken());
  const [influencer, setInfluencer] = useState(() => getStoredInfluencerProfile());
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(token && isStoredInfluencerTokenValid() && influencer);

  // Sync profile on mount or token change
  const refreshProfile = useCallback(async () => {
    if (!token || !isStoredInfluencerTokenValid()) {
      setInfluencer(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await getInfluencerProfileApi();
      if (res.success && res.data) {
        setInfluencer(res.data);
        setStoredInfluencerAuth(token, res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Failed to refresh influencer profile:', err);
      // If unauthorized, clear
      if (err.response?.status === 401) {
        clearStoredInfluencerAuth();
        setToken(null);
        setInfluencer(null);
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, [token]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Login handler
  const login = async (identifier, password) => {
    const res = await loginInfluencerApi(identifier, password);
    if (res.success && res.token && res.influencer) {
      setToken(res.token);
      setInfluencer(res.influencer);
      setStoredInfluencerAuth(res.token, res.influencer);
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  // Logout handler
  const logout = () => {
    clearStoredInfluencerAuth();
    setToken(null);
    setInfluencer(null);
    window.location.href = '/influencer/login';
  };

  // Update profile handler
  const updateProfile = async (data) => {
    const res = await updateInfluencerProfileApi(data);
    if (res.success && res.data) {
      setInfluencer((prev) => ({
        ...prev,
        ...res.data,
      }));
      setStoredInfluencerAuth(token, {
        ...(influencer || {}),
        ...res.data,
      });
      return res;
    }
    throw new Error(res.message || 'Failed to update profile.');
  };

  const value = {
    token,
    influencer,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshProfile,
    updateProfile,
  };

  return (
    <InfluencerAuthContext.Provider value={value}>
      {children}
    </InfluencerAuthContext.Provider>
  );
};

export const useInfluencerAuth = () => {
  const context = useContext(InfluencerAuthContext);
  if (!context) {
    throw new Error('useInfluencerAuth must be used within an InfluencerAuthProvider');
  }
  return context;
};

export default InfluencerAuthProvider;
