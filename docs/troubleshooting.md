# Troubleshooting

This guide addresses common setup, build, database, and runtime issues for the **MMMK WODE** platform.

## Setup Issues

### Frontend cannot reach backend

Check:

- `VITE_BACKEND_URL` is set and includes protocol.
- Backend is running.
- Backend CORS allows the frontend origin.
- Browser dev tools do not show mixed-content errors.

### Backend exits on startup

Likely causes:

- `MONGO_URI` missing or invalid.
- MongoDB network access blocked.
- Port already in use.

The backend exits on MongoDB connection failure in `Config/db.js`.

### CORS errors

Allowed origins are configured in `app.js` from:

- `FRONTEND_URL`
- `CLIENT_URL`
- hard-coded deployed/localhost origins

Set `FRONTEND_URL` and `CLIENT_URL` without a trailing slash or as comma-separated values. The code normalizes trailing slashes.

## Build Issues

### Frontend build has large chunk warnings

`npm run build` may warn about large chunks such as vendor, UI, or chart bundles. This is a performance warning, not necessarily a failed build.

Potential fixes:

- Route-level lazy loading for heavy admin/store pages.
- Manual chunks in `vite.config.js`.
- Avoid importing chart/admin libraries into public storefront paths.

### Browserslist warning

The build may print:

```text
Browserslist: caniuse-lite is outdated
```

This does not fail the build. Update the Browserslist database as part of dependency maintenance.

### Missing Vite environment variables

If API calls target `undefined/api/v1/...`, set `VITE_BACKEND_URL`.

Remember: Vite only exposes variables prefixed with `VITE_`.

## Runtime Issues

### 401 on protected routes

Check:

- Token is present in `Authorization: Bearer <token>` or expected cookie.
- `SECRET_KEY` matches the key used when token was issued.
- User/admin still exists in MongoDB.
- Frontend auth provider has not lost persisted state.

### Stripe webhook fails

Check:

- Webhook endpoint is exactly `/api/v1/payment/webhook`.
- `STRIPE_WEBHOOK_SECRET` matches the Stripe dashboard endpoint secret.
- The deployment platform passes raw request bodies correctly.
- JSON parser is skipped for this route in `app.js`; do not move webhook route behind normal JSON parsing.

### Uploaded images do not display

Check:

- Files exist in `MMK_backend(13-03)/uploads`.
- Backend serves `/uploads`.
- `VITE_IMAGE_URL`, `VITE_PUBLIC_UPLOAD_BASE_URL`, `UPLOAD_PUBLIC_BASE_URL`, and `PUBLIC_UPLOAD_BASE_URL` are configured consistently.
- In production, local uploads persist across restarts/deployments.

### Product listing is empty

Check:

- `/api/v1/products/all-products` returns data directly from the backend.
- Query parameters match expected category/filter values.
- Products have `status` and category values expected by controller filters.
- Product images resolve through `resolveAssetUrl`.

## Database Issues

### Duplicate key errors

Unique fields include:

- `Order.orderId`
- `SKU.sku`
- `GiftCard.code`
- `GiftCard.paymentOrderId` when present

Fix duplicate source data or regenerate identifiers before retrying writes.

### Password login fails after manual user/admin insert

`User` and `Admin` passwords are hashed by Mongoose `pre("save")` hooks. If records are inserted directly into MongoDB, passwords may not be hashed.

Create accounts through the API or hash passwords manually.

### Reset token expires too soon

`ResetToken.createdAt` uses `expires: 900`, which is 900 seconds.

## External Integration Issues

### Jura/Depoter sync fails

Check:

- `JURA_API_KEY`, `JURAA_API_KEY`, or `DEPOTER_API_KEY`.
- `JURA_URL`, `JURAA_URL`, or `DEPOTER_URL`.
- Product image URLs are publicly reachable.
- Logs in `logs/jura.log`.

### Translation fails

Check:

- Frontend `VITE_TRANSLATE_ENDPOINT` or `VITE_LIBRE_TRANSLATE_ENDPOINT`.
- Backend `LIBRE_TRANSLATE_ENDPOINT` or Azure translator variables.
- Network access from backend to translation provider.

### Email does not send

Check:

- Mail service environment variables. Needs Verification: exact SMTP variable names in `services/mailService.js`.
- Provider credentials and network access.
- Whether provider blocks less-secure app/password auth.

## Debugging Tips

- Start with backend `GET /health`.
- Use browser Network tab to inspect failed API URLs and status codes.
- Reproduce API failures with curl/Postman using the same headers and cookies.
- Check backend logs for controller stack traces.
- For auth failures, decode the JWT payload and verify the user/admin id exists.
- For frontend cache issues, invalidate TanStack Query or reload with devtools cache disabled.
