const express = require("express");
const router = express.Router();
const { isAdmin } = require("./Middleware/AdminAuth");
const { isUser } = require("./Middleware/UserAuth");

// admin router
const categoryRoutes = require("./Routes/category.router");
const productRoutes = require("./Routes/product.router");
const userRoutes = require("./Routes/user.router");
const orderRoutes = require("./Routes/order.router");
const couponRoutes = require("./Routes/coupon.router");
const supportRoutes = require("./Routes/support.router");
const filterRoutes = require("./Routes/filter.router");
const paymentRoutes = require("./Routes/payment.router");
const editPageRoutes = require("./Routes/editPage.router");
const pricingRoutes = require("./Routes/pricing.router");
const adminRoutes = require("./Routes/review.router");
const giftCardRoutes = require("./Routes/giftCard.router");
const dashboardRoutes = require("./Routes/dashboard.router");
const analyticsRoutes = require("./Routes/analytics.router");
const uploadRoutes = require("./Routes/upload.router");
const emailTemplateRoutes = require("./Routes/emailTemplate.router");
const abandonedCartRoutes = require("./Routes/abandonedCart.router");

// non Auth router
const nonAuth_ProductsRoutes = require("./Routes/non-auth-routes/product.routes");
const nonAuth_CategoryRoutes = require("./Routes/non-auth-routes/category.routes");
const nonAuth_editPageRoutes = require("./Routes/non-auth-routes/editPage.routes");
const nonAuth_adminAuthRoutes = require("./Routes/non-auth-routes/adminAuth.routes");
const nonAuth_useAuthRoutes = require("./Routes/non-auth-routes/userAuth.routes");
const nonAuth_paymentRoutes = require("./Routes/non-auth-routes/payment.routes");
const nonAuth_supportRoutes = require("./Routes/non-auth-routes/support.routes");
const nonAuth_filterRoutes = require("./Routes/non-auth-routes/filter.routes");
const nonAuth_reviewRoutes = require("./Routes/non-auth-routes/review.routes");
const nonAuth_webhookRoutes = require("./Routes/non-auth-routes/webhook.routes");
const nonAuth_translateRoutes = require("./Routes/non-auth-routes/translate.routes");
const nonAuth_localeRoutes = require("./Routes/non-auth-routes/locale.routes");
const nonAuth_checkoutRoutes = require("./Routes/non-auth-routes/checkout.routes");

// user router
const user_cartRouter = require("./Routes/user-routes/cart.router");
const user_giftCardRouter = require("./Routes/user-routes/gift-card.router");
const user_pricingRouter = require("./Routes/user-routes/pricing.router");
const user_profileRouter = require("./Routes/user-routes/profile.router");
const user_paymentRouter = require("./Routes/user-routes/payment.router");
const user_tabbyRouter = require("./Routes/user-routes/tabby.router");
const user_orderRouter = require("./Routes/user-routes/order.router");
const user_couponRouter = require("./Routes/user-routes/coupon.router");
const user_reviewRouter = require("./Routes/user-routes/review.router");
const user_wishListRouter = require("./Routes/user-routes/wishList.router");

// ################################################################### Routes ###################################################################

// admin
router.use("/api/v1/admin/category", isAdmin, categoryRoutes);
router.use("/api/v1/admin/product", isAdmin, productRoutes);
router.use("/api/v1/admin/user", isAdmin, userRoutes);
router.use("/api/v1/admin/order", isAdmin, orderRoutes);
router.use("/api/v1/admin/coupon", isAdmin, couponRoutes);
router.use("/api/v1/admin/support", isAdmin, supportRoutes);
router.use("/api/v1/admin/filter", isAdmin, filterRoutes);
router.use("/api/v1/admin/payment", isAdmin, paymentRoutes);
router.use("/api/v1/admin/editPage", isAdmin, editPageRoutes);
router.use("/api/v1/admin/pricing", isAdmin, pricingRoutes);
router.use("/api/v1/admin/review", isAdmin, adminRoutes);
router.use("/api/v1/admin/giftCard", isAdmin, giftCardRoutes);
router.use("/api/v1/admin/dashboard", isAdmin, dashboardRoutes);
router.use("/api/v1/admin/analytics", isAdmin, analyticsRoutes);
router.use("/api/v1/admin/upload", isAdmin, uploadRoutes);
router.use("/api/v1/admin/emailTemplate", isAdmin, emailTemplateRoutes);
router.use("/api/v1/admin/abandoned-cart", isAdmin, abandonedCartRoutes);

// non auth
router.use("/api/v1/products", nonAuth_ProductsRoutes);
router.use("/api/v1/category", nonAuth_CategoryRoutes);
router.use("/api/v1/editPage", nonAuth_editPageRoutes);
router.use("/api/v1/admin", nonAuth_adminAuthRoutes);
router.use("/api/v1/user", nonAuth_useAuthRoutes);
router.use("/api/v1/support", nonAuth_supportRoutes);
router.use("/api/v1", nonAuth_paymentRoutes);
router.use("/api/v1/filter", nonAuth_filterRoutes);
router.use("/api/v1/review", nonAuth_reviewRoutes);
router.use("/api/v1/webhook", nonAuth_webhookRoutes);
router.use("/api/v1/translate", nonAuth_translateRoutes);
router.use("/api/v1", nonAuth_localeRoutes);
router.use("/api/v1/checkout", nonAuth_checkoutRoutes);

// user
router.use("/api/v1/user/cart", isUser, user_cartRouter);
router.use("/api/v1/user/gift-card", isUser, user_giftCardRouter);
router.use("/api/v1/user/pricing", isUser, user_pricingRouter);
router.use("/api/v1/user/profile", isUser, user_profileRouter);
router.use("/api/v1/user/payment", isUser, user_paymentRouter);
router.use("/api/v1/user/tabby", isUser, user_tabbyRouter);
router.use("/api/v1/user/order", isUser, user_orderRouter);
router.use("/api/v1/user/coupon", isUser, user_couponRouter);
router.use("/api/v1/user/review", isUser, user_reviewRouter);
router.use("/api/v1/user/wish-list", isUser, user_wishListRouter);

module.exports = router;
