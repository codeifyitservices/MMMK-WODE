import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getStoredUserToken } from '../../utils/authStorage';

const useAuth = () => {
  const token = getStoredUserToken();

  if (!token) return false;

  try {
    const { exp } = jwtDecode(token);
    if (Date.now() >= exp * 1000) {
      localStorage.removeItem('userToken');
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

const UserProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuth();
  const { pathname } = useLocation();

  if (isAuthenticated) {
    return children;
  } else {
    return <Navigate to="/auth" state={{ from: pathname }} replace />;
  }
};

export default UserProtectedRoute;
