/* eslint-disable react/prop-types */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useInfluencerAuth } from '../../context/InfluencerAuthProvider';

const InfluencerProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useInfluencerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-2 border-[#dfba73] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-[#dfba73] font-medium">
          Verifying Influencer Credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/influencer/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default InfluencerProtectedRoute;
