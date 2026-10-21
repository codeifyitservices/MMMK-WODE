import { Outlet, useLocation } from 'react-router-dom';

import Header from '../layout/Header';
import Footer from '../layout/Footer';
import ScrollToTop from '../hook/ScrollTop';
import Navbar from '../components/global/Navbar';
import TopStrip from '../components/global/TopStrip';
import InfluencerBanner from '../components/global/InfluencerBanner';
import EmailPopup from '../components/global/EmailPopup';

const Root = () => {
  const location = useLocation();
  // const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isInfluencerRoute = location.pathname.startsWith('/influencer');
  // const isLoggedIn = true;

  // if (isLoggedIn && !isAdminRoute) {
  //   navigate("/admin/dashboard");
  // }

  return (
    <div className="w-full relative">
      {!isAdminRoute && !isInfluencerRoute && <TopStrip />}
      {!isAdminRoute && !isInfluencerRoute && <InfluencerBanner />}
      {!isAdminRoute && !isInfluencerRoute && <Navbar />}
      <Header />
      <ScrollToTop>
        <Outlet />
      </ScrollToTop>

      <EmailPopup />
      {!isAdminRoute && <Footer />}
    </div>
  );
};

export default Root;
