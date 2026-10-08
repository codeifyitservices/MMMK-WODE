import React from 'react';
import { Navigate } from 'react-router-dom';
import {
  clearStoredAdminAuth,
  isStoredAdminTokenValid,
} from '../../utils/adminAuth';

const useAuth = () => {
  const isValid = isStoredAdminTokenValid();
  if (!isValid) {
    clearStoredAdminAuth();
  }
  return isValid;
};

const AdminProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuth();
  return isAuthenticated ? children : <Navigate to="/admin/login" />;
};

export default AdminProtectedRoute;
