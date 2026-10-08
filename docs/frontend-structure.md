# Frontend Structure

Frontend root: `MMK_frontend(13-03)`. This is the React storefront and admin dashboard for the **MMMK WODE** platform.

## Technology Stack

- Vite
- React 18
- React Router DOM 6
- TanStack Query
- Redux Toolkit
- Tailwind CSS
- Ant Design
- Stripe React SDK
- i18next/react-i18next
- Framer Motion, Swiper, charting libraries

## Folder Structure

```text
src/
  Admin/                  # Admin pages and admin UI
  apis/
    admin/                # Admin API clients
    nonAuth/              # Public API clients
    user/                 # User-authenticated API clients
  assets/                 # Bundled images/assets
  components/
    global/               # Navbar, buttons, layout helpers, protected routes
    listing/              # Product listing components
    checkout/             # Checkout UI
    profiles/             # User profile sections
    home/                 # Homepage sections
  context/                # React context providers
  css/                    # Global/admin CSS
  layout/                 # Root layout, loading, not-found, coming-soon
  locales/                # Translation JSON
  pages/                  # Storefront route pages
  Redux/                  # Redux store
  redux/                  # Redux slices
  router/                 # SiteRouter and AdminRouter
  utils/                  # Auth, API, asset, currency, localization helpers
```

Needs Verification: both `Redux` and `redux` directories exist; their division appears historical.

## Routing Architecture

`src/App.jsx` creates the top-level router:

- `/admin/login` loads admin login.
- `/admin/*` loads `AdminRouter`.
- `/*` loads `SiteRouter`.

### Storefront Routes

Defined in `src/router/SiteRouter.jsx`.

Public routes:

- `/`
- `/product-listings`
- `/product-details/:id`
- `/auth`
- `/forgot-password`
- `/reset-password/:token`
- `/about-us`
- `/contact-us`
- `/privacy-policy`
- `/return-policy`
- `/refund-policy`
- `/terms-conditions`

User-protected routes:

- `/shopping-cart`
- `/checkout`
- `/thank-you/:orderId`
- `/order-success/:orderId`
- `/profile/my-account`
- `/profile/my-orders`
- `/profile/saved-items`
- `/profile/address-book`
- `/profile/my-credit`
- `/profile/payment-methods`
- `/gift-cards`
- `/gift-cards/buy`

### Admin Routes

Defined in `src/router/AdminRouter.jsx`.

Admin-protected routes:

- `/admin/dashboard`
- `/admin/category`
- `/admin/products`
- `/admin/review`
- `/admin/users`
- `/admin/gift-card`
- `/admin/orders`
- `/admin/coupons`
- `/admin/support`
- `/admin/edit-pages/homepage/section-2`
- `/admin/edit-pages/homepage/section-8`
- `/admin/edit-pages/homepage/section-9`
- `/admin/edit-pages/homepage/section-11`
- `/admin/edit-pages/homepage/section-12`
- `/admin/edit-pages/homepage/section-products`
- `/admin/edit-pages/footer`
- `/admin/filters`
- `/admin/payment`

## State Management

Providers are mounted in `src/main.jsx` and `src/App.jsx`.

| Provider | Purpose |
| --- | --- |
| Redux `Provider` | Global Redux store from `Redux/Store/store.js`. |
| `AdminAuthProvider` | Admin auth state. |
| `UserAuthProvider` | User auth state. |
| `QueryClientProvider` | TanStack Query caching/fetching. |
| `CurrencyProvider` | Currency selection and rates. |
| `GlobalProvider` | Categories, homepage products, global data. |
| `CartProvider` | Cart operations and cart data for site routes. |

## API Layers

API clients are grouped by authorization boundary:

- `src/apis/nonAuth`: public catalog, auth, support, review, CMS content, filters.
- `src/apis/user`: cart, order, payment, profile, gift card, coupon, review, wishlist, pricing.
- `src/apis/admin`: admin CRUD, dashboard, upload, CMS configuration.

Most clients use Axios with `VITE_BACKEND_URL`. User/admin clients include credentials or tokens through shared client helpers.

## Reusable Components

Important reusable component areas:

- `components/global`: `Banner`, `Navbar`, `Footer`, protected route wrappers, buttons, SEO, search.
- `components/listing`: `ProductGrid`, `SidebarFilter`, `SkeletonCard`.
- `components/checkout`: checkout form and payment UI.
- `components/profiles`: profile tabs and account/order/address/payment sections.
- `components/home`: homepage content sections.

## Key Flows

### Product Listing

1. Route `/product-listings` reads URL query filters.
2. `ProductListing.jsx` calls `getAllProducts`.
3. Products are rendered through `ProductGrid`.
4. Filters are loaded through `SidebarFilter` and `/api/v1/filter/get-all`.
5. Pagination changes update local listing state.

### Product Detail and Cart

1. Product detail calls `/api/v1/products/get-single/:id`.
2. SKU data is fetched from `/api/v1/products/get-product-skus/:id`.
3. Cart actions call `/api/v1/user/cart/*`.
4. Cart state is exposed by `CartProvider`.

### Checkout

1. User proceeds from cart to `/checkout`.
2. Checkout uses user profile/address data, pricing, coupons, credits, and Stripe.
3. Backend payment endpoints create/refresh payment status.
4. Successful order routes to thank-you/order success pages.

### Admin Product Management

1. Admin logs in through `/admin/login`.
2. `AdminProtectedRoute` guards admin pages.
3. Admin product pages use `src/apis/admin/product.js`.
4. File upload uses admin product routes or `/api/v1/admin/upload/images`.

## Internationalization

The app uses `i18next`, locale JSON files, and `TranslationContext.jsx`. Backend translation can be reached through `/api/v1/translate` or a configured translation endpoint.

Needs Verification: supported language UX and fallback policy should be reviewed with product requirements.
