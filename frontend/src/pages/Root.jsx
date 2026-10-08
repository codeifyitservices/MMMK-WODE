import { Outlet, useLocation } from 'react-router-dom';

import Header from '../layout/Header';
import Footer from '../layout/Footer';
import ScrollToTop from '../hook/ScrollTop';
import Navbar from '../components/global/Navbar';
import TopStrip from '../components/global/TopStrip';

const Root = () => {
  const location = useLocation();
  // const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');
  // const isLoggedIn = true;

  // if (isLoggedIn && !isAdminRoute) {
  //   navigate("/admin/dashboard");
  // }

  return (
    <div className="w-full relative">
      {!isAdminRoute && <TopStrip />}
      {!isAdminRoute && <Navbar />}
      <Header />
      <ScrollToTop>
        <Outlet />
      </ScrollToTop>

      {!isAdminRoute && <Footer />}
    </div>
  );
};

export default Root;
