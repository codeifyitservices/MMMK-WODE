import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy } from 'react';
import AdminProtectedRoute from '../components/global/AdminProtectedRoute';
import { AdminProvider } from '../context/AdminProvider';
import AdminSidebar from '../Admin/UI/AdminSidebar';
import '../css/admin.css';

// Lazy imports for all admin pages
const Dashboard = lazy(() => import('../Admin/pages/Dashboard').catch(() => { window.location.reload(); }));
const CategoryPage = lazy(() => import('../Admin/pages/Category/CategoryPage').catch(() => { window.location.reload(); }));
const AdminProductPage = lazy(
  () => import('../Admin/pages/Products/ProductPage')
);
const ProductPerformance = lazy(
  () => import('../Admin/pages/ProductPerformance/ProductPerformance').catch(() => { window.location.reload(); })
);
const ProductViewsPage = lazy(
  () => import('../Admin/pages/ProductViews/ProductViewsPage').catch(() => { window.location.reload(); })
);
const ReviewPage = lazy(() => import('../Admin/pages/review/ReviewPage').catch(() => { window.location.reload(); }));
const UserPage = lazy(() => import('../Admin/pages/Users/UserPage').catch(() => { window.location.reload(); }));
const GiftCardPage = lazy(() => import('../Admin/pages/giftCard/GiftCardPage').catch(() => { window.location.reload(); }));
const OrderPage = lazy(() => import('../Admin/pages/Orders/OrderPage').catch(() => { window.location.reload(); }));
const CouponPage = lazy(() => import('../Admin/pages/Coupons/CouponPage').catch(() => { window.location.reload(); }));
const SupportPage = lazy(() => import('../Admin/pages/Support/SupportPage').catch(() => { window.location.reload(); }));
const Section2 = lazy(
  () => import('../Admin/pages/editPage/home/section2/Section2')
);
const Section8 = lazy(
  () => import('../Admin/pages/editPage/home/section8/Section8')
);
const Section9 = lazy(
  () => import('../Admin/pages/editPage/home/section9/Section9')
);
const Section11 = lazy(
  () => import('../Admin/pages/editPage/home/section11/Section11')
);
const Section12 = lazy(
  () => import('../Admin/pages/editPage/home/section12/Section12')
);
const FormWithFields = lazy(
  () => import('../Admin/pages/editPage/home/sectionProducts/SectionProducts')
);
const Footer = lazy(() => import('../Admin/pages/editPage/home/footer/Footer').catch(() => { window.location.reload(); }));
const FilterPage = lazy(() => import('../Admin/pages/Filters/FilterPage').catch(() => { window.location.reload(); }));
const PaymentPage = lazy(() => import('../Admin/pages/Payments/PaymentPage').catch(() => { window.location.reload(); }));
const TopStripPage = lazy(() => import('../Admin/pages/TopStrip/TopStripPage').catch(() => { window.location.reload(); }));
const HomeBanner = lazy(() => import('../Admin/pages/editPage/home/banner/BannerBubbleSettings').catch(() => { window.location.reload(); }));
const EmailTemplatePage = lazy(() => import('../Admin/pages/EmailTemplate/EmailTemplatePage').catch(() => { window.location.reload(); }));
const AbandonedCartPage = lazy(() => import('../Admin/pages/AbandonedCart/AbandonedCartPage').catch(() => { window.location.reload(); }));

export default function AdminRouter() {
  return (
    <AdminProtectedRoute>
      <AdminProvider>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <AdminSidebar>
                <Dashboard />
              </AdminSidebar>
            }
          />
          <Route
            path="category"
            element={
              <AdminSidebar>
                <CategoryPage />
              </AdminSidebar>
            }
          />
          <Route
            path="products"
            element={
              <AdminSidebar>
                <AdminProductPage />
              </AdminSidebar>
            }
          />
          <Route
            path="product-performance"
            element={
              <AdminSidebar>
                <ProductPerformance />
              </AdminSidebar>
            }
          />
          <Route
            path="most-viewed"
            element={
              <AdminSidebar>
                <ProductViewsPage />
              </AdminSidebar>
            }
          />
          <Route
            path="product-views"
            element={
              <AdminSidebar>
                <ProductViewsPage />
              </AdminSidebar>
            }
          />
          <Route
            path="review"
            element={
              <AdminSidebar>
                <ReviewPage />
              </AdminSidebar>
            }
          />
          <Route
            path="users"
            element={
              <AdminSidebar>
                <UserPage />
              </AdminSidebar>
            }
          />
          <Route
            path="gift-card"
            element={
              <AdminSidebar>
                <GiftCardPage />
              </AdminSidebar>
            }
          />
          <Route
            path="orders"
            element={
              <AdminSidebar>
                <OrderPage />
              </AdminSidebar>
            }
          />
          <Route
            path="abandoned-carts"
            element={
              <AdminSidebar>
                <AbandonedCartPage />
              </AdminSidebar>
            }
          />
          <Route
            path="coupons"
            element={
              <AdminSidebar>
                <CouponPage />
              </AdminSidebar>
            }
          />
          <Route
            path="support"
            element={
              <AdminSidebar>
                <SupportPage />
              </AdminSidebar>
            }
          />
          <Route path="edit-pages">
            <Route path="homepage">
              <Route
                path="section-2"
                element={
                  <AdminSidebar>
                    <Section2 />
                  </AdminSidebar>
                }
              />
              <Route
                path="section-8"
                element={
                  <AdminSidebar>
                    <Section8 />
                  </AdminSidebar>
                }
              />
              <Route
                path="section-9"
                element={
                  <AdminSidebar>
                    <Section9 />
                  </AdminSidebar>
                }
              />
              <Route
                path="section-11"
                element={
                  <AdminSidebar>
                    <Section11 />
                  </AdminSidebar>
                }
              />
              <Route
                path="section-12"
                element={
                  <AdminSidebar>
                    <Section12 />
                  </AdminSidebar>
                }
              />
              <Route
                path="section-products"
                element={
                  <AdminSidebar>
                    <FormWithFields />
                  </AdminSidebar>
                }
              />
            </Route>
            <Route
              path="footer"
              element={
                <AdminSidebar>
                  <Footer />
                </AdminSidebar>
              }
            />
          </Route>
          <Route
            path="filters"
            element={
              <AdminSidebar>
                <FilterPage />
              </AdminSidebar>
            }
          />
          <Route
            path="payment"
            element={
              <AdminSidebar>
                <PaymentPage />
              </AdminSidebar>
            }
          />
          <Route
            path="top-strip"
            element={
              <AdminSidebar>
                <TopStripPage />
              </AdminSidebar>
            }
          />
          <Route
            path="banner-bubble"
            element={
              <AdminSidebar>
                <HomeBanner />
              </AdminSidebar>
            }
          />
          <Route
            path="email-template"
            element={
              <AdminSidebar>
                <EmailTemplatePage />
              </AdminSidebar>
            }
          />
        </Routes>
      </AdminProvider>

    </AdminProtectedRoute>
  );
}
