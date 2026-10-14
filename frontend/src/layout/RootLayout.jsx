import { TranslationProvider } from '../context/TranslationContext';
import { Outlet, useLocation } from 'react-router-dom';
import Seo from '../components/global/Seo';
import { useEffect, useLayoutEffect } from 'react';
import { trackVisitorTraffic } from '../utils/trafficTracker';

const RootLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!pathname.startsWith('/admin')) {
      trackVisitorTraffic(pathname);
    }
  }, [pathname]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <TranslationProvider>
      <Seo />
      <Outlet key={pathname} />
    </TranslationProvider>
  );
};

export default RootLayout;
