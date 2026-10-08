/* eslint-disable react/prop-types */
import { Navigate } from 'react-router-dom';
import { useAuth } from './Admin/Auth/context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { authToken } = useAuth();
  if (!authToken) {
    return <Navigate to="/admin/login" />;
  }
  return children;
};

export default ProtectedRoute;
