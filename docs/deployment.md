# MMMK WODE - Deployment

This document describes the production deployment details for the **MMMK WODE** platform.

## Applications & Domains

In the production environment, the applications are hosted under the primary domain **https://mmmk-wode.com**:
- **Frontend App**: `https://mmmk-wode.com`
- **Backend API**: `https://mmmk-wode.com`

Deploy the repository as two services:

1. Frontend static app from `MMK_frontend(13-03)`.
2. Backend Node/Express API from `MMK_backend(13-03)`.

## Frontend Deployment

Build command:

```bash
cd "MMK_frontend(13-03)"
npm install
npm run build
```

Build output:

```text
MMK_frontend(13-03)/dist
```

Serve `dist` with a static host such as Vercel, Netlify, Nginx, or another static web host.

The repository includes `MMK_frontend(13-03)/vercel.json`, so Vercel deployment is supported. Needs Verification: exact production Vercel project settings.

Required production frontend environment variables:

- `VITE_BACKEND_URL` (set to `https://mmmk-wode.com`)
- `VITE_IMAGE_URL` or `VITE_PUBLIC_UPLOAD_BASE_URL` (set to `https://mmmk-wode.com/uploads`)
- Stripe publishable key variables used by the selected `VITE_STRIPE_MODE`
- Translation endpoint variables if not using backend default

## Backend Deployment

Install and run:

```bash
cd "MMK_backend(13-03)"
npm install
npm start
```

`npm start` uses `nodemon app.js`. For production, consider replacing this with a process manager command such as `node app.js` under PM2/systemd/container runtime. Needs Verification: current hosting platform may intentionally use Nodemon.

Required production backend environment variables:

- `PORT`
- `NODE_ENV=production`
- `MONGO_URI`
- `SECRET_KEY`
- `FRONTEND_URL` (set to `https://mmmk-wode.com`)
- `CLIENT_URL` (set to `https://mmmk-wode.com`)
- Stripe keys and webhook secret if payments are enabled
- Jura/Depoter variables if fulfillment sync is enabled
- Upload public URL variables if uploads are served from a CDN/proxy (defaults to `https://mmmk-wode.com/uploads`)
- Translation and mail variables if those features are enabled

## Hosting Requirements

Backend host must support:

- Long-running Node process.
- Outbound HTTPS to Stripe, Jura/Depoter, translation, and email providers.
- Persistent storage for `uploads/`, or an external file storage replacement.
- MongoDB network access.
- HTTPS termination or proxy headers. `app.js` trusts proxy and redirects to HTTPS in production when `x-forwarded-proto` is present and not `https`.

## Database Deployment

There are no migration files.

Deployment steps:

1. Provision MongoDB.
2. Set `MONGO_URI`.
3. Start backend.
4. Verify collections and indexes are created.
5. Create initial admin account.

Needs Verification:

- Existing production seed process.
- Whether database backups in `backups/` are current or generated manually.
- Whether any indexes were added directly in MongoDB.

## File Upload Deployment

Current upload behavior:

- Files are written to local `uploads/`.
- Files are served from `/uploads`.
- Static cache headers are set to one year and immutable.

For horizontally scaled or serverless deployments, local disk uploads are not sufficient. Use shared persistent storage or object storage and update upload/public URL handling.

## Payment Webhooks

Stripe webhook route:

```text
POST /api/v1/payment/webhook
```

Set `STRIPE_WEBHOOK_SECRET` to the endpoint secret from Stripe. The backend skips JSON parsing for this route so Stripe signature validation can use the raw body.

Needs Verification: exact webhook events configured in Stripe dashboard.

## CI/CD

No CI/CD workflow files were found in the scanned code. Needs Verification if CI/CD is configured outside this repository.

Suggested checks before deployment:

```bash
cd "MMK_frontend(13-03)"
npm run lint
npm run build

cd "../MMK_backend(13-03)"
npm test
```

## Production Smoke Tests

After deployment:

1. `GET /health` returns success.
2. Frontend loads with no CORS errors.
3. Public product listing loads.
4. User login/signup works.
5. Admin login works.
6. Uploads can be served from `/uploads/...`.
7. Stripe test payment or configured live payment path works.
8. Jura/Depoter sync logs show successful responses if enabled.
