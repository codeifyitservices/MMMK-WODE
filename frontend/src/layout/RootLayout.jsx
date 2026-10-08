import { TranslationProvider } from '../context/TranslationContext';
import { Outlet, useLocation } from 'react-router-dom';
import Seo from '../components/global/Seo';
import { useLayoutEffect } from 'react';

const RootLayout = () => {
  const { pathname } = useLocation();

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
