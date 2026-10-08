# MMMK WODE - Setup

This document details the configuration and setup for the **MMMK WODE** ecommerce platform.

## Prerequisites

- Node.js and npm. The repository does not declare an `.nvmrc` or `engines` field. Needs Verification: exact production Node version.
- MongoDB database reachable by the backend.
- Stripe account and keys for card payments.
- SMTP credentials if password reset and gift-card emails are used.
- Jura/Depoter API credentials if product/order sync and delivery tracking are used.

## Repository Layout

```text
MMMK/
  MMK_frontend(13-03)/   # Vite React storefront and admin UI
  MMK_backend(13-03)/    # Express API and MongoDB models
  docs/                  # Developer documentation
```

## Install Dependencies

Install frontend dependencies:

```bash
cd "MMK_frontend(13-03)"
npm install
```

Install backend dependencies:

```bash
cd "MMK_backend(13-03)"
npm install
```

## Environment Variables

Do not commit real secrets. Both projects currently use local `.env` files.

### Frontend

The frontend reads these variables from Vite:

| Variable | Purpose |
| --- | --- |
| `VITE_BACKEND_URL` | Backend base URL, used by all API clients. |
| `VITE_IMAGE_URL` | Base URL for product/category image paths. |
| `VITE_PUBLIC_UPLOAD_BASE_URL` | Public uploads fallback used by `src/utils/assetUrl.js`. |
| `VITE_SHARED_UPLOAD_BASE_URL` | Upload base used by admin upload API. |
| `VITE_TRANSLATE_ENDPOINT` | Optional translation endpoint override. |
| `VITE_LIBRE_TRANSLATE_ENDPOINT` | Optional LibreTranslate base URL. |
| `VITE_STRIPE_MODE` | `test` or `live`. Defaults to `live` in payment UI code. |
| `VITE_STRIPE_TEST_API_KEY` | Stripe publishable key for test mode. |
| `VITE_STRIPE_LIVE_API_KEY` | Stripe publishable key for live mode. |
| `VITE_STRIPE_API_KEY` | Fallback Stripe publishable key. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Fallback Stripe publishable key. |

Local Development Example:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_IMAGE_URL=http://localhost:8000/uploads
VITE_PUBLIC_UPLOAD_BASE_URL=http://localhost:8000/uploads
VITE_STRIPE_MODE=test
VITE_STRIPE_TEST_API_KEY=pk_test_xxx
```

Production Configuration:

In the production environment for **MMMK WODE**, the frontend and backend are hosted under `https://mmmk-wode.com`. The production environment variables must be set as:

```env
VITE_BACKEND_URL=https://mmmk-wode.com
VITE_IMAGE_URL=https://mmmk-wode.com/uploads
VITE_PUBLIC_UPLOAD_BASE_URL=https://mmmk-wode.com/uploads
```

### Backend

The backend reads these variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | Express port. Defaults to `8000`. |
| `NODE_ENV` | Enables HTTPS redirect behavior when `production`. |
| `MONGO_URI` | MongoDB connection string used by `Config/db.js`. |
| `MONGODB_URL` | Used by `utils/dbConfig.js`; Needs Verification because main app uses `MONGO_URI`. |
| `SECRET_KEY` | JWT signing key for admin and user auth. |
| `FRONTEND_URL` | Allowed CORS origin and payment redirect base. |
| `CLIENT_URL` | Allowed CORS origin and password reset URL base. |
| `UPLOAD_PUBLIC_BASE_URL` | Public URL used when mapping uploads. |
| `PUBLIC_UPLOAD_BASE_URL` | Public upload URL used by Jura sync service. |
| `JURA_URL`, `JURAA_URL`, `DEPOTER_URL` | External fulfillment API base URLs. |
| `JURA_ORDER_URL`, `JURAA_ORDER_URL`, `DEPOTER_ORDER_URL` | External order endpoint overrides. |
| `JURA_API_KEY`, `JURAA_API_KEY`, `DEPOTER_API_KEY` | External fulfillment API keys. |
| `JURA_RETURN_URL`, `JURAA_RETURN_URL` | Return sync endpoint overrides. |
| `JURA_EXCHANGE_URL`, `JURAA_EXCHANGE_URL` | Exchange sync endpoint overrides. |
| `STRIPE_MODE` | `test` or `live`. Defaults to `live`. |
| `STRIPE_SECRET_KEY` | Live/default Stripe secret key. |
| `STRIPE_TEST_SECRET_KEY` | Stripe test secret key. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret. |
| `ALLOW_LIVE_PAYMENT_TEST` | Allows test behavior with live-like config when set to `true`. |
| `LIBRE_TRANSLATE_ENDPOINT` | LibreTranslate endpoint. |
| `AZURE_TRANSLATOR_ENDPOINT`, `AZURE_ENDPOINT` | Azure translation endpoint. |
| `AZURE_TRANSLATOR_KEY` | Azure translation key. |
| `AZURE_TRANSLATOR_REGION` | Azure translation region. |

For production deployments of **MMMK WODE** at `https://mmmk-wode.com`, the following backend environment variables should be configured:

```env
NODE_ENV=production
FRONTEND_URL=https://mmmk-wode.com
CLIENT_URL=https://mmmk-wode.com
UPLOAD_PUBLIC_BASE_URL=https://mmmk-wode.com/uploads
PUBLIC_UPLOAD_BASE_URL=https://mmmk-wode.com/uploads
```

Needs Verification: mail/SMTP variable names are used through `services/mailService.js`, but exact required names should be checked before production setup.

## Database Setup

The backend uses MongoDB through Mongoose. There are no migration files in the repository.

1. Create a MongoDB database.
2. Set `MONGO_URI` in `MMK_backend(13-03)/.env`.
3. Start the backend. Mongoose creates collections as models are used.
4. Seed/create an admin with `POST /api/v1/admin/create` or through an existing database seed process. Needs Verification: there is no dedicated seed command in `package.json`.

## Local Development

Start the backend:

```bash
cd "MMK_backend(13-03)"
npm start
```

`npm start` runs `nodemon app.js`.

Start the frontend:

```bash
cd "MMK_frontend(13-03)"
npm run dev
```

The Vite dev server usually runs on `http://localhost:5173`.

## Build Commands

Frontend production build:

```bash
cd "MMK_frontend(13-03)"
npm run build
```

Frontend preview:

```bash
cd "MMK_frontend(13-03)"
npm run preview
```

Backend tests:

```bash
cd "MMK_backend(13-03)"
npm test
```

Backend has no production build step; it runs directly with Node/Nodemon.

## Useful Checks

- `GET /health` on the backend returns a basic health response.
- Frontend API clients require `VITE_BACKEND_URL`.
- Backend CORS allows configured `FRONTEND_URL`, `CLIENT_URL`, localhost Vite ports, and known deployed origins.
