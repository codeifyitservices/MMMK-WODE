import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import './i18n';
import { lazy, Suspense } from 'react';

import { ToastContainer } from 'react-toastify';
import { GlobalProvider } from './context/GlobalProvider';
import { CurrencyProvider } from './context/CurrencyContext';
import SiteLoading from './layout/SiteLoading';
import RootLayout from './layout/RootLayout';
const SiteRouter = lazy(() => import('./router/SiteRouter').catch(() => { window.location.reload(); }));
const AdminRouter = lazy(() => import('./router/AdminRouter').catch(() => { window.location.reload(); }));
const Login = lazy(() => import('./Admin/Auth/Login').catch(() => { window.location.reload(); }));
const ForgotPassword = lazy(() => import('./Admin/Auth/ForgotPassword').catch(() => { window.location.reload(); }));
const ResetPassword = lazy(() => import('./Admin/Auth/ResetPassword').catch(() => { window.location.reload(); }));

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<SiteLoading />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/admin/forgot-password"
        element={
          <Suspense fallback={<SiteLoading />}>
            <ForgotPassword />
          </Suspense>
        }
      />
      <Route
        path="/admin/reset-password/:token"
        element={
          <Suspense fallback={<SiteLoading />}>
            <ResetPassword />
          </Suspense>
        }
      />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<SiteLoading />}>
            <AdminRouter />
          </Suspense>
        }
      />
      <Route
        path="/*"
        element={
          <Suspense fallback={<SiteLoading />}>
            <SiteRouter />
          </Suspense>
        }
      />
    </Route>
  )
);

const App = () => {
  return (
    <CurrencyProvider>
      <GlobalProvider>
        <ToastContainer />
        <div className="overflow-x-hidden">
          <RouterProvider router={router} />
        </div>
      </GlobalProvider>
    </CurrencyProvider>
  );
};

export default App;
