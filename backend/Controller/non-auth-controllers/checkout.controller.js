const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const CheckoutOtp = require("../../Models/CheckoutOtp");
const { sendMail, sendOrderConfirmationEmail } = require("../../services/mailService");
const {
  normalizeEmail,
  getOrCreateCheckoutCustomer,
  saveCheckoutCustomerAddresses,
  getCheckoutCustomerAddresses,
  upsertDefaultAddress,
} = require("../../utils/checkoutCustomer");
const {
  createOrder,
} = require("../user-controllers/order.controller");
const {
  createPaymentIntent,
} = require("../user-controllers/payment.controller");

const OTP_TTL_MINUTES = Number(process.env.CHECKOUT_OTP_TTL_MINUTES || 10);

const sanitizePaymentError = (error) => {
  const msg = error?.message || "Internal server error";
  if (
    msg.includes("API key") ||
    msg.includes("API Key") ||
    msg.includes("api key") ||
    msg.includes("sk_live") ||
    msg.includes("sk_test") ||
    error?.type === "StripeAuthenticationError"
  ) {
    return "Payment configuration error. Please contact support.";
  }
  return msg;
};
const OTP_RESEND_SECONDS = Number(process.env.CHECKOUT_OTP_RESEND_SECONDS || 60);
const OTP_MAX_ATTEMPTS = Number(process.env.CHECKOUT_OTP_MAX_ATTEMPTS || 5);
const OTP_MAX_RESENDS = Number(process.env.CHECKOUT_OTP_MAX_RESENDS || 5);
const CHECKOUT_TOKEN_TTL = process.env.CHECKOUT_TOKEN_TTL || "30m";
const CHECKOUT_COOKIE_NAME = "checkoutEmailToken";

const checkoutOtpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
});

const checkoutOtpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
});

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const createCheckoutToken = (email) =>
  jwt.sign(
    {
      email,
      purpose: "checkout_email_verified",
    },
    process.env.SECRET_KEY,
    { expiresIn: CHECKOUT_TOKEN_TTL }
  );

const getBearerToken = (req) => {
  const auth = req.headers.authorization || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return "";
};

const getCheckoutToken = (req) =>
  req.headers["x-checkout-verification"] ||
  getBearerToken(req) ||
  req.cookies?.[CHECKOUT_COOKIE_NAME] ||
  "";

const setCheckoutCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(CHECKOUT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 30 * 60 * 1000,
  });
};

const verifyCheckoutEmail = async (req, res, next) => {
  try {
    const token = getCheckoutToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Email verification is required before checkout.",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (decoded?.purpose !== "checkout_email_verified" || !decoded?.email) {
      return res.status(401).json({
        success: false,
        message: "Invalid checkout verification session.",
      });
    }

    req.verifiedCheckoutEmail = normalizeEmail(decoded.email);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Your email verification session has expired. Please verify again.",
    });
  }
};

const sendCheckoutOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const latestOtp = await CheckoutOtp.findOne({ email }).sort({ createdAt: -1 });
    if (latestOtp && !latestOtp.consumedAt) {
      const secondsSinceLastSend = Math.floor(
        (Date.now() - new Date(latestOtp.lastSentAt).getTime()) / 1000
      );
      if (secondsSinceLastSend < OTP_RESEND_SECONDS) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${OTP_RESEND_SECONDS - secondsSinceLastSend}s before resending OTP.`,
          retryAfter: OTP_RESEND_SECONDS - secondsSinceLastSend,
        });
      }

      if (latestOtp.resendCount >= OTP_MAX_RESENDS) {
        return res.status(429).json({
          success: false,
          message: "OTP resend limit reached. Please try again later.",
        });
      }
    }

    await CheckoutOtp.updateMany(
      { email, consumedAt: null },
      { $set: { consumedAt: new Date() } }
    );

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await CheckoutOtp.create({
      email,
      otpHash: hashOtp(otp),
      expiresAt,
      resendCount: latestOtp ? latestOtp.resendCount + 1 : 0,
      lastSentAt: new Date(),
    });

    await sendMail(
      email,
      "Your MMMK Wode checkout verification code",
      `Your MMMK Wode checkout verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      `<p>Your MMMK Wode checkout verification code is:</p><h2>${otp}</h2><p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>`
    );

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      expiresIn: OTP_TTL_MINUTES * 60,
      resendAfter: OTP_RESEND_SECONDS,
    });
  } catch (error) {
    console.error("[CHECKOUT_OTP_SEND]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
};

const verifyCheckoutOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const otpRecord = await CheckoutOtp.findOne({
      email,
      consumedAt: null,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP has already been used or was not requested.",
      });
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      otpRecord.consumedAt = new Date();
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      otpRecord.consumedAt = new Date();
      await otpRecord.save();
      return res.status(429).json({
        success: false,
        message: "Too many invalid OTP attempts. Please request a new OTP.",
      });
    }

    if (otpRecord.otpHash !== hashOtp(otp)) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check the code and try again.",
        attemptsRemaining: Math.max(0, OTP_MAX_ATTEMPTS - otpRecord.attempts),
      });
    }

    otpRecord.consumedAt = new Date();
    await otpRecord.save();

    await getOrCreateCheckoutCustomer(email);
    const addresses = await getCheckoutCustomerAddresses(email);
    const token = createCheckoutToken(email);
    setCheckoutCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      token,
      data: addresses,
    });
  } catch (error) {
    console.error("[CHECKOUT_OTP_VERIFY]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
    });
  }
};

const getSavedCheckoutAddresses = async (req, res) => {
  const data = await getCheckoutCustomerAddresses(req.verifiedCheckoutEmail);
  return res.status(200).json({
    success: true,
    data,
  });
};

const saveCheckoutAddresses = async (req, res) => {
  const user = await saveCheckoutCustomerAddresses({
    email: req.verifiedCheckoutEmail,
    shippingAddress: req.body?.shippingAddress,
    billingAddress: req.body?.billingAddress,
  });

  return res.status(200).json({
    success: true,
    message: "Checkout addresses saved.",
    data: {
      email: req.verifiedCheckoutEmail,
      shippingAddresses: user?.shippingAddresses || [],
      billingAddresses: user?.billingAddresses || [],
    },
  });
};

const attachVerifiedCheckoutUser = async (req, res, next) => {
  try {
    const user = await saveCheckoutCustomerAddresses({
      email: req.verifiedCheckoutEmail,
      shippingAddress: req.body?.shippingAddress,
      billingAddress: req.body?.billingAddress,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Verified checkout customer was not found.",
      });
    }

    req.user = { id: user._id, email: user.email };
    req.body.guestEmail = req.verifiedCheckoutEmail;
    next();
  } catch (error) {
    console.error("[CHECKOUT_CUSTOMER_ATTACH]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to prepare verified checkout customer.",
    });
  }
};

const { Country } = require("country-state-city");
const countriesList = require("../../countries.json");
const rateByWeight = require("../../rateByWeight.json");

const calculateShippingCharges = (countryCode, weight) => {
  if (!countryCode) return 0;
  const countryData = Country.getCountryByCode(countryCode);
  if (!countryData?.name) return 0;
  const roundedWeight = Math.max(0.5, Math.ceil(Number(weight || 0) * 2) / 2);
  let zone = countriesList?.countries[countryData.name];
  if (!zone) {
    const entry = Object.entries(countriesList?.countries || {}).find(
      ([name]) =>
        countryData.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(countryData.name.toLowerCase())
    );
    if (entry) zone = entry[1];
  }
  const rate = zone ? rateByWeight[String(roundedWeight)]?.[zone] : 0;
  return parseFloat(rate) || 0;
};

const { convertToCurrency } = require("../../utils/currency");

const getDeliveryFee = async (req, res) => {
  try {
    const { country, weight, currency } = req.body;
    if (!country) {
      return res.status(400).json({ success: false, message: "Country is required." });
    }
    const feeInUsd = calculateShippingCharges(country, weight || 0);
    const targetCurrency = currency || "USD";
    const convertedFee = convertToCurrency(feeInUsd, targetCurrency);
    return res.status(200).json({ success: true, deliveryFee: convertedFee, feeInUsd });
  } catch (error) {
    console.error("[DELIVERY_FEE_ERROR]", error);
    return res.status(500).json({ success: false, message: "Failed to calculate delivery fee." });
  }
};

const confirmApplePayPayment = async (req, res) => {
  try {
    const {
      paymentMethodId,
      email,
      shippingAddress,
      billingAddress,
      deliveryFee,
      products,
      currency,
      couponCode,
    } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ error: "paymentMethodId is required" });
    }
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }
    if (!products || !products.length) {
      return res.status(400).json({ error: "products are required" });
    }

    // 1. Resolve User
    let user = null;
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    let token = null;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    } else if (req.cookies && req.cookies.userToken) {
      token = req.cookies.userToken;
    }

    const User = require("../../Models/User");

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        user = await User.findById(decoded.id);
      } catch (err) {
        // Token invalid, fallback to guest
      }
    }

    if (!user) {
      // Guest path: Get or create checkout customer
      user = await getOrCreateCheckoutCustomer(email);
      if (!user) {
        return res.status(400).json({ error: "Failed to create guest checkout customer" });
      }
      // Save checkout addresses
      await saveCheckoutCustomerAddresses({
        email,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
      });
    } else {
      // Registered user path: Save/update the address details they just used via Apple Pay
      // to their profile if shippingAddress/billingAddress is provided.
      if (shippingAddress) {
        user.shippingAddresses = upsertDefaultAddress(
          user.shippingAddresses || [],
          shippingAddress
        );
      }
      if (billingAddress || shippingAddress) {
        user.billingAddresses = upsertDefaultAddress(
          user.billingAddresses || [],
          billingAddress || shippingAddress
        );
      }
      await user.save();
    }

    // 2. Prepare mock request for buildCheckoutCalculation
    const calculationBody = {
      products,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      couponCode: couponCode || null,
      shippingCharges: deliveryFee || 0,
      currency: currency || "USD",
    };

    const { buildCheckoutCalculation } = require("../../utils/checkoutCalculator");
    const checkout = await buildCheckoutCalculation({
      body: calculationBody,
      user,
      userId: user._id,
      lang: req.lang || "en",
      isGiftCardOrder: false,
      strictClientValidation: false,
      rejectClientMismatch: false,
    });

    const {
      currencyCode,
      currencyRate,
      orderItems,
      totalQuantity,
      appliedCouponCode,
      display,
      base,
      audit,
    } = checkout;

    // Validate stock
    const { validateStockAvailability } = require("../../utils/stockService");
    await validateStockAvailability(
      orderItems.map((item) => ({
        productId: item.id,
        sku: item.sku,
        quantity: item.quantity,
        name: item.name,
      }))
    );

    const payableTotal = display.payableTotal.amount;
    const finalAmount = Math.round(payableTotal * 100);
    const totalAmountValue = display.totalBeforeCredits.amount;

    if (finalAmount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount calculated" });
    }

    const { generateUniqueOrderId } = require("../../utils/globalMethods");
    const orderId = generateUniqueOrderId();

    // 3. Create Stripe Payment Intent and Confirm it immediately
    const stripeMode = (process.env.STRIPE_MODE || "live").toLowerCase();
    const stripeSecretKey =
      stripeMode === "test"
        ? process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY
        : process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    const stripeInstance = require("stripe")(stripeSecretKey);

    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: finalAmount,
      currency: currencyCode.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        orderId,
        userId: String(user._id),
      },
    });

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        error: `Stripe payment confirmation failed with status: ${paymentIntent.status}`,
      });
    }

    // 4. Create Order
    const Order = require("../../Models/Order");
    const orderData = {
      userId: user._id,
      status: "Processing",
      mode: "card",
      paymentMethod: "stripe",
      orderId,
      products: orderItems,
      paymentStatus: "Paid",
      totalAmount: totalAmountValue,
      amountPaidOnline: payableTotal,
      amountDueCOD: 0,
      amount: totalAmountValue,
      amountUSD: base.totalBeforeCredits,
      currencyRate: currencyRate,
      totalQuantity,
      currency: currencyCode,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      couponCode: appliedCouponCode || "",
      creditsUsed: 0,
      creditsDeducted: false,
      creditsRestored: false,
      price: {
        total: totalAmountValue,
        payableTotal: payableTotal,
        subtotal: display.subtotal.amount,
        shippingCharges: display.shippingCharges.amount,
        extraCharges: display.extraCharges.amount,
        couponDiscount: display.couponDiscount.amount,
        creditApplied: 0,
      },
      stripeSessionId: null,
      paymentIntentId: paymentIntent.id,
      temp: {
        paymentSource: "apple_pay",
        amountAudit: audit,
        amountBase: base,
        stripeExpectedAmount: finalAmount,
      },
    };

    const order = new Order(orderData);
    await order.save();

    // 5. Post Checkout success actions
    const { deductStockForOrder } = require("../../utils/stockService");
    const { recordCouponUsageForOrder } = require("../../utils/couponUsage");

    try {
      await deductStockForOrder(order);
      await Order.findByIdAndUpdate(order._id, {
        $set: { stockAdjusted: true },
      });
      await recordCouponUsageForOrder(order);
    } catch (stockError) {
      console.error("[ORDER_STOCK] Failed to deduct stock for Apple Pay", stockError);
    }

    try {
      const { sendOrderToJura, extractJuraOrderId } = require("../../utils/juraDelivery");
      const juraResponse = await sendOrderToJura(order);
      const juraOrderId = extractJuraOrderId(juraResponse) || order.orderId;

      await Order.findByIdAndUpdate(order._id, {
        $set: {
          depoter_order_id: juraOrderId,
          depoterSyncStatus: "Synced",
          depoterSyncedAt: new Date(),
          depoterSyncError: "",
          temp: {
            ...(order.temp || {}),
            juraResponse,
            juraSyncedAt: new Date().toISOString(),
          },
        },
      });
    } catch (juraError) {
      console.error("[JURA_SYNC] Failed to sync Apple Pay order to Jura", juraError);
      await Order.findByIdAndUpdate(order._id, {
        $set: {
          depoterSyncStatus: "Failed",
          depoterSyncError: juraError.message || "Failed to sync with Jura",
        },
      });
    }

    sendOrderConfirmationEmail(order, user).catch(console.error);

    return res.status(200).json({
      success: true,
      orderId,
    });

  } catch (error) {
    console.error("[APPLE_PAY_CHECKOUT_ERROR]", error);
    return res.status(500).json({ error: sanitizePaymentError(error) });
  }
};

module.exports = {
  checkoutOtpSendLimiter,
  checkoutOtpVerifyLimiter,
  sendCheckoutOtp,
  verifyCheckoutOtp,
  verifyCheckoutEmail,
  getSavedCheckoutAddresses,
  saveCheckoutAddresses,
  attachVerifiedCheckoutUser,
  createVerifiedGuestOrder: createOrder,
  createVerifiedGuestPaymentIntent: createPaymentIntent,
  getDeliveryFee,
  confirmApplePayPayment,
};

