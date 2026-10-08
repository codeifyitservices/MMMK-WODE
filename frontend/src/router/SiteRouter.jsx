import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import UserProtectedRoute from '../components/global/UserProtectedRoute';
import CartProvider from '../context/CartProvider';
import SiteLoading from '../layout/SiteLoading';
import '../css/index.css';
import Root from '../pages/Root';
import ComingSoon from '../layout/ComingSoon';
// Lazy imports for all site pages
const Home = lazy(() => import('../pages/Home').catch(() => { window.location.reload(); }));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy.jsx').catch(() => { window.location.reload(); }));
const ReturnPolicy = lazy(() => import('../pages/ReturnPolicy').catch(() => { window.location.reload(); }));
const TermsConditions = lazy(() => import('../pages/TermsConditions').catch(() => { window.location.reload(); }));
const AuthPage = lazy(() => import('../pages/AuthPage').catch(() => { window.location.reload(); }));
const ForgetPassword = lazy(() => import('../pages/ForgetPassword').catch(() => { window.location.reload(); }));
const NewPassword = lazy(() => import('../pages/NewPassword').catch(() => { window.location.reload(); }));
const ProductListing = lazy(() => import('../pages/ProductListing').catch(() => { window.location.reload(); }));
const ProductDetails = lazy(() => import('../pages/ProductDetails').catch(() => { window.location.reload(); }));
const ShoppingCart = lazy(() => import('../pages/ShoppingCart').catch(() => { window.location.reload(); }));
const Checkout = lazy(() => import('../pages/Checkout').catch(() => { window.location.reload(); }));
const ThankYou = lazy(() => import('../pages/ThankYou').catch(() => { window.location.reload(); }));
const OrderSuccess = lazy(() => import('../pages/OrderSuccess').catch(() => { window.location.reload(); }));
const GiftCardSuccess = lazy(() => import('../pages/GiftCardSuccess').catch(() => { window.location.reload(); }));
const GiftCardCancel = lazy(() => import('../pages/GiftCardCancel').catch(() => { window.location.reload(); }));
const PaymentCancel = lazy(() => import('../pages/PaymentCancel').catch(() => { window.location.reload(); }));
const BuyGiftCard = lazy(() => import('../pages/BuyGiftCard').catch(() => { window.location.reload(); }));
const GiftCard = lazy(() => import('../pages/GiftCard').catch(() => { window.location.reload(); }));
const ContactUs = lazy(() => import('../pages/ContactUs').catch(() => { window.location.reload(); }));
const Profile = lazy(() => import('../pages/ProfileSidebar').catch(() => { window.location.reload(); }));
const CheckoutForm = lazy(() => import('../components/checkout/CheckoutForm').catch(() => { window.location.reload(); }));
const ProductPage = lazy(() => import('../pages/ProductPage').catch(() => { window.location.reload(); }));

const MyAccounts = lazy(() => import('../components/profiles/MyAccounts').catch(() => { window.location.reload(); }));
const MyOrders = lazy(() => import('../components/profiles/MyOrders').catch(() => { window.location.reload(); }));
const SavedItems = lazy(() => import('../components/profiles/SavedItems').catch(() => { window.location.reload(); }));
const AddressBook = lazy(() => import('../components/profiles/AddressBook').catch(() => { window.location.reload(); }));
const MyCredit = lazy(() => import('../components/profiles/MyCredit').catch(() => { window.location.reload(); }));
const PaymentMethods = lazy(
  () => import('../components/profiles/PaymentMethods').catch(() => { window.location.reload(); })
);
const AboutUs = lazy(() => import('../components/AboutUs').catch(() => { window.location.reload(); }));
const RecoverCart = lazy(() => import('../pages/RecoverCart').catch(() => { window.location.reload(); }));
// Add more lazy imports as needed
const PageNotFound = lazy(() => import('../layout/PageNotFound').catch(() => { window.location.reload(); }));

export default function SiteRouter() {
  return (
    <CartProvider>
      <Routes>
        {/* User Routes */}
        <Route element={<Root />}>
          <Route
            index
            element={
              <Suspense fallback={<SiteLoading />}>
                <Home />
              </Suspense>
            }
          />
          <Route
            path="/product-listings"
            element={
              <Suspense fallback={<SiteLoading />}>
                <ProductListing />
              </Suspense>
            }
          />
          <Route
            path="/product-details/:id"
            element={
              <Suspense fallback={<SiteLoading />}>
                <ProductDetails />
              </Suspense>
            }
          />
          <Route
            path="/shopping-cart"
            element={
              <Suspense fallback={<SiteLoading />}>
                <ShoppingCart />
              </Suspense>
            }
          />
          <Route
            path="/cart/recover"
            element={
              <Suspense fallback={<SiteLoading />}>
                <RecoverCart />
              </Suspense>
            }
          />
          <Route
            path="/checkout"
            element={
              <Suspense fallback={<SiteLoading />}>
                <Checkout />
              </Suspense>
            }
          />
          <Route
            path="/thank-you/:orderId"
            element={
              <Suspense fallback={<SiteLoading />}>
                <ThankYou />
              </Suspense>
            }
          />
          <Route
            path="/order-success/:orderId"
            element={
              <Suspense fallback={<SiteLoading />}>
                <OrderSuccess />
              </Suspense>
            }
          />
          <Route
            path="/gift-card-success/:orderId"
            element={
              <Suspense fallback={<SiteLoading />}>
                <GiftCardSuccess />
              </Suspense>
            }
          />
          <Route
            path="/gift-card-cancel"
            element={
              <Suspense fallback={<SiteLoading />}>
                <GiftCardCancel />
              </Suspense>
            }
          />
          <Route
            path="/cancel"
            element={
              <Suspense fallback={<SiteLoading />}>
                <PaymentCancel />
              </Suspense>
            }
          />
          <Route path="/profile">
            <Route index element={<Navigate to="/profile/my-account" />} />
            <Route
              path="my-account"
              element={
                <UserProtectedRoute>
                  <Suspense fallback={<SiteLoading />}>
                    <Profile>
                      <MyAccounts />
                    </Profile>
                  </Suspense>
                </UserProtectedRoute>
              }
            />
            <Route
              path="my-orders"
              element={
                <UserProtectedRoute>
                  <Suspense fallback={<SiteLoading />}>
                    <Profile>
                      <MyOrders />
                    </Profile>
                  </Suspense>
                </UserProtectedRoute>
              }
            />
            <Route
              path="saved-items"
              element={
                <UserProtectedRoute>
                  <Suspense fallback={<SiteLoading />}>
                    <Profile>
                      <SavedItems />
                    </Profile>
                  </Suspense>
                </UserProtectedRoute>
              }
            />
            <Route
              path="address-book"
              element={
                <UserProtectedRoute>
                  <Suspense fallback={<SiteLoading />}>
                    <Profile>
                      <AddressBook />
                    </Profile>
                  </Suspense>
                </UserProtectedRoute>
              }
            />
            <Route
              path="my-credit"
              element={
                <UserProtectedRoute>
                  <Suspense fallback={<SiteLoading />}>
                    <Profile>
                      <MyCredit />
                    </Profile>
                  </Suspense>
                </UserProtectedRoute>
              }
            />
            <Route
              path="payment-methods"
              element={
                <UserProtectedRoute>
                  <Suspense fallback={<SiteLoading />}>
                    <Profile>
                      <PaymentMethods />
                    </Profile>
                  </Suspense>
                </UserProtectedRoute>
              }
            />
          </Route>
          <Route path="/gift-cards">
            <Route
              index
              element={
                <UserProtectedRoute>
                  <Suspense fallback={<SiteLoading />}>
                    <GiftCard />
                  </Suspense>
                </UserProtectedRoute>
              }
            />
            <Route
              path="buy"
              element={
                <UserProtectedRoute>
                  <Suspense fallback={<SiteLoading />}>
                    <BuyGiftCard />
                  </Suspense>
                </UserProtectedRoute>
              }
            />
          </Route>
          <Route
            path="/auth"
            element={
              <Suspense fallback={<SiteLoading />}>
                <AuthPage />
              </Suspense>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <Suspense fallback={<SiteLoading />}>
                <ForgetPassword />
              </Suspense>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <Suspense fallback={<SiteLoading />}>
                <NewPassword />
              </Suspense>
            }
          />
          <Route
            path="/about-us"
            element={
              <Suspense fallback={<SiteLoading />}>
                <AboutUs />
              </Suspense>
            }
          />
          <Route
            path="/contact-us"
            element={
              <Suspense fallback={<SiteLoading />}>
                <ContactUs />
              </Suspense>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <Suspense fallback={<SiteLoading />}>
                <PrivacyPolicy />
              </Suspense>
            }
          />
          <Route
            path="/return-policy"
            element={
              <Suspense fallback={<SiteLoading />}>
                <ReturnPolicy />
              </Suspense>
            }
          />
          <Route
            path="/refund-policy"
            element={
              <Suspense fallback={<SiteLoading />}>
                <ReturnPolicy />
              </Suspense>
            }
          />
          <Route
            path="/terms-conditions"
            element={
              <Suspense fallback={<SiteLoading />}>
                <TermsConditions />
              </Suspense>
            }
          />

          <Route
            path="*"
            element={
              <Suspense fallback={<SiteLoading />}>
                <PageNotFound />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </CartProvider>
  );
}
