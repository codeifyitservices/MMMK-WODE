# Backend Structure

Backend root: `MMK_backend(13-03)`. This is the backend API for the **MMMK WODE** platform.

## Technology Stack

- Node.js
- Express 4
- MongoDB with Mongoose
- JWT authentication
- bcrypt password hashing
- Multer file uploads
- Stripe SDK
- Nodemailer
- Axios for external services

## Folder Structure

```text
MMK_backend(13-03)/
  app.js                 # Express app bootstrap
  routes.js              # Central route mounting
  Config/
    db.js                # MongoDB connection
  Controller/
    admin-controllers/   # Admin route handlers
    non-auth-controllers/# Public route handlers
    user-controllers/    # User-authenticated handlers
  Middleware/
    AdminAuth.js
    UserAuth.js
    errorHandler.js
  Models/                # Mongoose models
  Routes/
    non-auth-routes/
    user-routes/
    *.router.js          # Admin routers
  services/              # Mail, translation, Jura sync
  utils/                 # Shared helpers and external integration utilities
  scripts/               # Operational scripts
  tests/                 # Node-based test scripts
  uploads/               # Local uploaded media
  logs/                  # Runtime logs
```

## Application Bootstrap

`app.js` performs:

1. Loads `.env`.
2. Connects to MongoDB through `Config/db.js`.
3. Creates Express app.
4. Enables `trust proxy`.
5. Applies HTTPS redirect and security headers.
6. Serves `/uploads` statically with long-lived cache headers.
7. Configures CORS with credentials.
8. Parses cookies and JSON, except Stripe webhook raw-body route.
9. Sets `req.lang` from headers/query/body.
10. Mounts `routes.js`.
11. Exposes `GET /health`.
12. Applies default error handler.

## Routes

`routes.js` defines authorization boundaries:

- Admin routes under `/api/v1/admin/*` are protected by `isAdmin`, except admin auth routes.
- User routes under `/api/v1/user/*` are protected by `isUser`, except public user auth routes.
- Public catalog/CMS/support/review/payment/webhook routes are unprotected.

See [API Reference](./api-reference.md) for all exposed endpoints.

## Controllers

Controller groups:

- `Controller/admin-controllers`
  - Category, product, user, order, coupon, support, filter, payment, edit page, pricing, review, gift card, dashboard, upload.
- `Controller/non-auth-controllers`
  - Public catalog/category/filter/edit page/auth/support/review/payment webhook/translate/locale.
- `Controller/user-controllers`
  - Auth, cart, profile, order, payment, coupon, gift card, review, wishlist, pricing.

Controllers generally:

- Read `req.params`, `req.query`, `req.body`, `req.user`, or `req.admin`.
- Call Mongoose models directly and/or utility services.
- Return JSON responses.

Needs Verification: response format is not fully standardized across controllers.

## Middleware

### `AdminAuth.js`

- Reads JWT from `Authorization: Bearer <token>` or `adminAuthToken` cookie.
- Verifies with `SECRET_KEY`.
- Loads `Admin` by decoded id.
- Sets `req.admin`.

### `UserAuth.js`

- Reads JWT from `Authorization: Bearer <token>` or `userToken` cookie.
- Verifies with `SECRET_KEY`.
- Loads `User` by decoded id.
- Sets `req.user`.

### `errorHandler.js`

- Handles Multer errors and invalid file type errors as `400`.
- Returns generic `500` for other errors.

## Models

Mongoose models are defined in `Models/`:

- `Admin`
- `User`
- `Category`
- `Product`
- `SKU`
- `Cart`
- `WishList`
- `Order`
- `Coupon`
- `GiftCard`
- `Review`
- `Support`
- `Filter`
- `Payment`
- `Pricing`
- `ResetToken`
- `EditPage`
- `Supplier`

See [Data Model](./data-model.md) for schema details.

## Database Layer

`Config/db.js` connects Mongoose using `process.env.MONGO_URI`. On connection failure it logs the error and exits the process.

There are no migration files. Collection creation and indexes are managed by Mongoose schemas at runtime.

## File Uploads

`utils/multer.js` stores uploads in `MMK_backend(13-03)/uploads`.

Accepted MIME types:

- JPEG, PNG, GIF, AVIF, WebP
- MP4, MPEG, OGG, WebM

Max file size: `50 MB`.

Files are served publicly at `/uploads`.

## Services and Utilities

Important service/util areas:

- `services/jura.service.js`: product sync to Jura.
- `utils/juraConfig.js`, `utils/juraDelivery.js`, `utils/juraReturnExchange.js`: Jura/Depoter configuration, tracking, returns/exchanges.
- `utils/depoterConfig.js`, `utils/depoterDelivery.js`: Depoter integration helpers.
- `services/translate.js`: LibreTranslate/Azure translation abstraction.
- `services/mailService.js`, `utils/giftCardMailer.js`: email delivery.
- `utils/stockService.js`: stock adjustments.
- `utils/creditService.js`: user credits.
- `utils/couponUsage.js`: coupon usage tracking.
- `utils/requestUploads.js`: request upload URL handling.
- `utils/logger.js`: logging helper.

## Background Jobs

No scheduler or worker process is defined in `package.json`. Operational scripts exist under `scripts/`, including product sync and backup scripts.

Needs Verification:

- Whether any scripts are run externally by cron/CI.
- Whether logs are rotated in production.

## Tests

Backend `npm test` runs:

```bash
node tests/run-upload-product-checks.js
node tests/run-order-sync-checks.js
```

These are Node scripts, not a Jest/Mocha test suite.
