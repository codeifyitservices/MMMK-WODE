# MMMK WODE - API Reference

Base URL: `https://mmmk-wode.com` in production (or `http://localhost:8000` locally).

Most API routes are mounted under `/api/v1`. The backend also exposes `GET /health`.

## Authentication

Admin-protected routes require either:

- `Authorization: Bearer <admin-jwt>`
- `adminAuthToken` cookie

User-protected routes require either:

- `Authorization: Bearer <user-jwt>`
- `userToken` cookie

Common auth errors:

```json
{ "message": "No token, authorization denied" }
```

```json
{ "message": "Token is not valid" }
```

## Common Response Shapes

Controllers are not fully standardized. Many return objects with `success`, `message`, `data`, or pagination fields. Endpoint-specific response payloads should be verified in the matching controller before building strict client contracts.

```json
{
  "success": true,
  "data": {}
}
```

```json
{
  "success": false,
  "message": "Validation or server error"
}
```

## Health

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Confirms the API process is running. |

Response:

```json
{ "success": true, "message": "Server running" }
```

## Public Authentication

Base: `/api/v1/user`

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| POST | `/login` | User login. | Body: credentials. Needs Verification: exact fields. |
| GET | `/logout` | User logout. | None. |
| POST | `/signup` | Create user account. | Body: user profile and password fields. Needs Verification. |
| POST | `/forgot-password` | Request reset token email. | Body includes email. |
| POST | `/update-password/:token` | Update password using reset token. | Body includes new password. Needs Verification. |

Base: `/api/v1/admin`

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| POST | `/login` | Admin login. | Body: username/password. |
| POST | `/create` | Create admin account. | Body: username/password. Needs Verification: intended public exposure. |
| GET | `/logout` | Admin logout. | None. |

## Public Catalog

Base: `/api/v1/products`

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| GET | `/search` | Search products. | Query: `q`, `limit`. |
| GET | `/all-products` | Paginated/filterable listing. | Query: `page`, `categories`, `gender`, `brand`, `price`, `discount`, `sort`, `q`, custom filters. |
| GET | `/related-products/:productId` | Related products for product detail. | Param: `productId`. |
| GET | `/all-products-with-filters` | Product list with filters, used for homepage/global data. | Query: filter object. |
| GET | `/all-brands` | Distinct brands. | None. |
| GET | `/get-single/:id` | Product detail. | Param: product id. |
| GET | `/get-product-skus/:id` | SKU list for a product. | Param: product id. |
| GET | `/get-random` | Random product list. | None. |
| GET | `/home-bootom-section` | Homepage bottom-section products. | None. |

Base: `/api/v1/category`

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| GET | `/all-category` | Public category list. | None. |
| GET | `/search` | Category search. | Query: search term. Needs Verification: exact query key. |

Base: `/api/v1/filter`

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| GET | `/get-all` | Public filters, optionally scoped by category. | Query: `categories`. |

Base: `/api/v1/review`

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| GET | `/get-by-product/:id` | Reviews for a product. | Param: product id. |

## Public CMS and Support

Base: `/api/v1/editPage`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/home/section-products` | Homepage configured products. |
| GET | `/home/banner` | Homepage banner content. |
| GET | `/home/section2` | Homepage section 2 content. |
| GET | `/home/section8` | Homepage section 8 content. |
| GET | `/home/section9` | Homepage section 9 content. |
| GET | `/home/section11` | Homepage section 11 content. |
| GET | `/home/section12` | Homepage section 12 content. |
| GET | `/home/getFooter` | Footer content. |

Base: `/api/v1/support`

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| POST | `/create` | Submit public support/contact request. | Body: support request fields. |

Base: `/api/v1/translate`

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| POST | `/` | Translate text. | Body: text and target language. Needs Verification. |

Base: `/api/v1`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/locale-detect` | Detect locale for the client. |

## Public Payments and Webhooks

Base: `/api/v1`

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| POST | `/payment/webhook` | Stripe webhook endpoint. | Raw Stripe payload. Auth: Stripe signature, not JWT. |

Base: `/api/v1/webhook`

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/jura` | Jura fulfillment webhook. |
| POST | `/juraa` | Jura fulfillment webhook alias. |
| POST | `/inventory-update` | External inventory update webhook. |

## User Cart

Base: `/api/v1/user/cart`

Authentication: user.

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| POST | `/add-item` | Add item to cart. | Body: product, sku, quantity, filters. Needs Verification. |
| GET | `/get-cart-item` | Get current user's cart. | None. |
| POST | `/set-cart-items` | Replace/sync cart items. | Body: cart items. |
| GET | `/remove-cart-item/:id` | Remove cart item. | Param: cart item id; query may include sku/quantity from frontend. |
| POST | `/save-for-later/:id` | Save an item for later. | Param: cart item id. |

## User Orders and Payments

Base: `/api/v1/user/order`

Authentication: user.

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| POST | `/create` | Create manual/user order. | Body: order payload. |
| GET | `/get-user-orders` | List current user's orders. | Query: pagination/filter options. |
| POST | `/request-return-exchange/:orderId` | Request return or exchange. | Param: order id; body: request details. |

Base: `/api/v1/user/payment`

Authentication: user.

| Method | Route | Purpose | Body / Query |
| --- | --- | --- | --- |
| POST | `/create-payment-intent` | Create Stripe payment intent. | Body: payment/order details. |
| POST | `/refresh-status/:orderId` | Refresh payment status. | Param: order id. |

## User Profile

Base: `/api/v1/user/profile`

Authentication: user.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/my-accounts/update` | Update account profile. |
| GET | `/my-accounts/get` | Get account profile. |
| GET | `/my-credits/get` | Get user credit balance. |
| GET | `/address-book/get` | Get addresses. |
| POST | `/address-book/:type/add` | Add address. |
| PUT | `/address-book/:type/update/:id` | Update address. |
| DELETE | `/address-book/:type/delete/:id` | Delete address. |
| PUT | `/address-book/:type/default/:id` | Set default address. |
| POST | `/payment-methods/update` | Add/update payment card metadata. |
| GET | `/payment-methods/get` | Get payment methods. |
| GET | `/payment-methods/delete/:id` | Delete payment card. |

`type` is used for address grouping, for example shipping or billing. Needs Verification: accepted values.

## User Coupons, Gift Cards, Reviews, Wishlist, Pricing

Base: `/api/v1/user/coupon`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/get-valid-token` | User | Get visible/valid coupons. |
| POST | `/apply-coupon` | User | Apply coupon code. |

Base: `/api/v1/user/gift-card`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/add-gift-card` | User | Redeem/apply gift card. |
| POST | `/create-gift-card` | User | Create purchased gift card. |
| GET | `/created-gift-cards` | User | List user's created gift cards. |
| POST | `/share/:giftCardId` | User | Share gift card with recipient. |

Base: `/api/v1/user/review`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/eligibility/:id` | User | Check review eligibility for product/order. |
| POST | `/add` | User | Add review. |

Base: `/api/v1/user/wish-list`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/add` | User | Add product to wishlist. |
| POST | `/remove` | User | Remove product from wishlist. |
| GET | `/:id` | User | Get wishlist by user id. |

Base: `/api/v1/user/pricing`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/get` | User | Get pricing config. |

## Admin Category and Product

Base: `/api/v1/admin/category`

Authentication: admin.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/add` | Create category with uploaded `image`. |
| POST | `/get/:id` | Get category by id. |
| GET | `/get-all` | List categories. |
| POST | `/edit/:id` | Update category with optional uploaded `image`. |
| GET | `/delete/:id` | Delete category. |
| POST | `/reorder` | Reorder categories. |

Base: `/api/v1/admin/product`

Authentication: admin.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/create` | Create product with uploaded media. |
| GET | `/get-all` | List admin products. |
| GET | `/get-single/:id` | Get product by id. |
| POST | `/update/:id` | Update product with uploaded media. |
| POST | `/delete/:id` | Delete product. |
| POST | `/reorder` | Reorder products. |

## Admin Orders

Base: `/api/v1/admin/order`

Authentication: admin.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/get-all` | List orders. |
| GET | `/get-single/:id` | Get order detail. |
| GET | `/delete/:id` | Delete order. |
| POST | `/create` | Create order from admin. |
| POST | `/update/:id` | Update order status/details. |
| POST | `/process-return-exchange/:orderId/:requestId` | Approve/reject/process return or exchange. |
| GET | `/check-jura-status/:orderId` | Check Jura sync/delivery status. |
| GET | `/check-depoter-status/:orderId` | Check Depoter sync/delivery status; controller alias uses `checkJuraStatus`. |

## Admin User, Coupon, Gift Card

Base: `/api/v1/admin/user`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/create` | Admin | Create user. |
| POST | `/update/:id` | Admin | Update user. |
| GET | `/get/:id` | Admin | Get user. |
| GET | `/get-all` | Admin | List users. |
| GET | `/delete/:id` | Admin | Delete user. |

Base: `/api/v1/admin/coupon`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/create` | Admin | Create coupon. |
| POST | `/update/:id` | Admin | Update coupon. |
| GET | `/get-all` | Admin | List coupons. |
| GET | `/delete/:id` | Admin | Delete coupon. |

Base: `/api/v1/admin/giftCard`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/add` | Admin | Add gift card. |
| POST | `/update/:id` | Admin | Update gift card. |
| POST | `/delete/:id` | Admin | Delete gift card. |
| GET | `/get-all` | Admin | List gift cards. |
| GET | `/get-active` | Admin | List active gift cards. |

## Admin Support, Filter, Payment, Pricing, Review

Base: `/api/v1/admin/support`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/get-all` | Admin | List support requests. |
| GET | `/delete/:id` | Admin | Delete support request. |
| POST | `/create` | Admin | Create support request. |
| POST | `/add-reply/:id` | Admin | Add reply to support request. |

Base: `/api/v1/admin/filter`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/get-all` | Admin | List filters. |
| POST | `/create` | Admin | Create filter. |
| POST | `/update/:id` | Admin | Update filter. |
| GET | `/delete/:id` | Admin | Delete filter. |

Base: `/api/v1/admin/payment`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/create` | Admin | Create payment record. |
| GET | `/get-all` | Admin | List payment records. |
| GET | `/delete/:id` | Admin | Delete payment record. |

Base: `/api/v1/admin/pricing`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/update` | Admin | Update shipping/tax pricing. |
| GET | `/get` | Admin | Get pricing config. |

Base: `/api/v1/admin/review`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/get-all` | Admin | List reviews. |
| DELETE | `/delete-review/:id` | Admin | Delete review. |

## Admin CMS, Dashboard, Upload

Base: `/api/v1/admin/editPage`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/home/banner/update` | Admin | Update homepage banner. |
| GET | `/home/banner/get` | Admin | Get homepage banner. |
| POST | `/home/section2/update` | Admin | Update section 2. |
| GET | `/home/section2/get` | Admin | Get section 2. |
| POST | `/home/section8/update` | Admin | Update section 8. |
| GET | `/home/section8/get` | Admin | Get section 8. |
| POST | `/home/section9/update` | Admin | Update section 9. |
| GET | `/home/section9/get` | Admin | Get section 9. |
| POST | `/home/section11/update` | Admin | Update section 11. |
| GET | `/home/section11/get` | Admin | Get section 11. |
| POST | `/home/section12/update` | Admin | Update section 12. |
| GET | `/home/section12/get` | Admin | Get section 12. |
| POST | `/home/section-products/update` | Admin | Update featured section products. |
| GET | `/home/section-products/get` | Admin | Get featured section products. |
| POST | `/footer/update` | Admin | Update footer. |
| GET | `/footer/get` | Admin | Get footer. |

Base: `/api/v1/admin/dashboard`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/get` | Admin | Dashboard metrics. |

Base: `/api/v1/admin/upload`

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/images` | Admin | Upload up to 10 files with field name `files`. |

## File Upload Constraints

Multer accepts:

- `image/jpeg`, `image/png`, `image/gif`, `image/avif`, `image/webp`
- `video/mp4`, `video/mpeg`, `video/ogg`, `video/webm`

Maximum file size is `50 MB`.

Uploads are stored in `MMK_backend(13-03)/uploads` and served at `/uploads`.
