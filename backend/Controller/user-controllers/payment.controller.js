const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const stripeMode = (process.env.STRIPE_MODE || "live").toLowerCase();
const stripeSecretKey =
  stripeMode === "test"
    ? process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? require("stripe")(stripeSecretKey) : null;
const Order = require("../../Models/Order");
const GiftCard = require("../../Models/GiftCard");
const Coupon = require("../../Models/coupon");
const User = require("../../Models/User");
const Product = require("../../Models/Product");
const SKU = require("../../Models/sku");
const CreditTransaction = require("../../Models/CreditTransaction");
const { createGiftCardCodeAndPassword } = require("../../services/giftCard");
const { generateUniqueOrderId } = require("../../utils/globalMethods");
const { localizeValue } = require("../../utils/localization");
const {
  sendOrderToJura,
  extractJuraOrderId,
} = require("../../utils/juraDelivery");
const { sendOrderConfirmationEmail } = require("../../services/mailService");
const {
  deductStockForOrder,
  validateStockAvailability,
} = require("../../utils/stockService");
const {
  normalizeAmount,
  resolveRequestedCredit,
  deductCreditsFromUser,
  restoreCreditsToUser,
} = require("../../utils/creditService");
const {
  assertCouponUsableByUser,
  recordCouponUsageForOrder,
} = require("../../utils/couponUsage");
const {
  CURRENCY_CONFIG,
  resolveCurrencyCode,
  convertAmount,
  resolveCurrencyRate,
} = require("../../utils/currency");
const {
  CheckoutAmountMismatchError,
  buildCheckoutCalculation,
} = require("../../utils/checkoutCalculator");
const {
  safeStartSession,
  safeCommitTransaction,
  safeAbortTransaction,
  safeEndSession,
} = require("../../utils/dbUtils");

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

const STRIPE_MIN_AMOUNTS = {
  AED: 2.0,
  USD: 0.5,
  INR: 0.5,
  EUR: 0.5,
  GBP: 0.3,
  MXN: 10,
  CNY: 4,
};

const getFrontendBaseUrl = () => {
  const url = process.env.FRONTEND_URL || "http://localhost:5173/";
  return url.endsWith("/") ? url : `${url}/`;
};

const isGiftCardPurchase = (body = {}) =>
  body?.orderType === "gift-card" ||
  body?.purchaseType === "gift-card" ||
  !!body?.giftCardPurchase;

const convertAmountToBase = (amount, currencyCode, currencyRate) => {
  const rate =
    currencyRate ||
    CURRENCY_CONFIG?.[resolveCurrencyCode(currencyCode)]?.rate ||
    1;
  return Number((Number(amount || 0) / rate).toFixed(2));
};

const percentageValue = (value, percentage) => {
  const numValue = parseFloat(value) || 0;
  const numPercentage = parseFloat(percentage) || 0;

  if (numPercentage === 0) return numValue;

  const discountedValue = numValue - (numValue * numPercentage) / 100;
  return Math.round(discountedValue * 100) / 100;
};

const issueGiftCardForOrder = async (order) => {
  if (!order) return null;

  const existingGiftCard = await GiftCard.findOne({
    paymentOrderId: order.orderId,
  });

  if (existingGiftCard) {
    return existingGiftCard;
  }

  const giftCardDetails = order?.temp?.giftCardPurchase || {
    name: order?.products?.[0]?.name || "Gift Card",
    amount: order?.amount || order?.price?.total || 0,
    currency: order?.currency || "USD",
  };

  if (!giftCardDetails?.name || !giftCardDetails?.amount) {
    return null;
  }

  const { code, password } = await createGiftCardCodeAndPassword();

  return GiftCard.create({
    name: giftCardDetails.name,
    amount: Number(giftCardDetails.amount),
    currency: giftCardDetails.currency || "USD",
    amountInCurrency: giftCardDetails.amountInCurrency || giftCardDetails.amount,
    code,
    password,
    status: "Active",
    createdBy: order.userId,
    paymentOrderId: order.orderId,
  });
};

const syncPaidOrderToJura = async (order) => {
  if (!order || order.depoter_order_id) {
    return {
      jura_order_id: order?.depoter_order_id || null,
      juraSyncStatus: order?.depoterSyncStatus || "Pending",
    };
  }

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

  

  return {
    jura_order_id: juraOrderId,
    juraSyncStatus: "Synced",
  };
};

const validateStripeSessionAmount = (order, session, source) => {
  const expectedAmount = Number(
    order?.temp?.stripeExpectedAmount ??
      order?.temp?.amountAudit?.backend?.payableTotal?.currencyMinor ??
      NaN,
  );
  const actualAmount = Number(session?.amount_total ?? NaN);
  const expectedCurrency = String(order?.currency || "").toLowerCase();
  const actualCurrency = String(session?.currency || "").toLowerCase();

  const valid =
    Number.isFinite(expectedAmount) &&
    Number.isFinite(actualAmount) &&
    expectedAmount === actualAmount &&
    expectedCurrency === actualCurrency;

  if (!valid) {
    console.error("[PAYMENT_AMOUNT_MISMATCH]", {
      source,
      orderId: order?.orderId,
      expectedAmount,
      actualAmount,
      expectedCurrency,
      actualCurrency,
      stripeSessionId: session?.id,
      orderTemp: order.temp, // Added this for deeper inspection
    });
  }

  return valid;
};

const markOrderAmountMismatch = async (order, session, source) =>
  Order.findByIdAndUpdate(
    order._id,
    {
      $set: {
        paymentStatus: "Failed",
        status: "Pending",
        stripeSessionId: session?.id || order.stripeSessionId,
        paymentIntentId:
          session?.payment_intent || order.paymentIntentId || null,
        temp: {
          ...(order.temp || {}),
          paymentAmountMismatch: {
            source,
            at: new Date().toISOString(),
            expectedAmount:
              order?.temp?.stripeExpectedAmount ??
              order?.temp?.amountAudit?.backend?.payableTotal?.currencyMinor,
            actualAmount: session?.amount_total,
            expectedCurrency: order.currency,
            actualCurrency: session?.currency,
            stripeSessionId: session?.id,
          },
        },
      },
    },
    { new: true },
  );

const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        error: `Stripe is not configured for ${stripeMode} mode`,
      });
    }

    const {
      products,
      shippingAddress,
      billingAddress,
      couponCode,
      shippingCharges,
      creditsUsed,
      creditsUsedBase,
      totalAmount,
      giftCardPurchase,
      isBagAdded,
      currency,
      currencyRate: requestedCurrencyRate,
    } = req.body;

    const giftCardOrder = isGiftCardPurchase(req.body);

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "No products provided" });
    }

    const orderId = generateUniqueOrderId();
    const frontendBaseUrl = getFrontendBaseUrl();
    const lang = req.lang || "en";

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const checkout = await buildCheckoutCalculation({
      body: req.body,
      user,
      userId: req.user.id,
      lang,
      isGiftCardOrder: giftCardOrder,
      strictClientValidation: true,
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

    if (!giftCardOrder) {
      await validateStockAvailability(
        orderItems.map((item) => ({
          productId: item.id,
          sku: item.sku,
          quantity: item.quantity,
          name: item.name,
        })),
      );
    }

    const finalCreditAppliedBase = base.creditApplied;
    const creditApplied = display.creditApplied.amount;
    const payableTotal = display.payableTotal.amount;

    const minAmount = STRIPE_MIN_AMOUNTS[currencyCode] || 0.5;
    if (payableTotal > 0 && payableTotal < minAmount) {
      return res.status(400).json({
        error: `The remaining amount of ${payableTotal} ${currencyCode} is below Stripe's minimum of ${minAmount} ${currencyCode}. Please use more credits or select Cash on Delivery.`,
      });
    }

    const finalAmount = Math.round(payableTotal * 100);
    const totalAmountValue = display.totalBeforeCredits.amount;

    // Determine payment method
    let paymentMethod = payableTotal > 0 ? "stripe" : "credits";
    if (payableTotal > 0 && creditApplied > 0) {
      paymentMethod = "credits+stripe";
    }

    const orderData = {
      userId: req.user.id,
      status: payableTotal > 0 ? "Pending" : "Processing",
      mode: payableTotal > 0 ? "card" : "credits",
      paymentMethod,
      orderId,
      products: orderItems,
      paymentStatus: payableTotal > 0 ? "Pending" : "Paid",
      totalAmount: totalAmountValue,
      amountPaidOnline: payableTotal > 0 ? payableTotal : 0,
      amountDueCOD: 0,
      amount: totalAmountValue,
      amountUSD: base.totalBeforeCredits,
      currencyRate: currencyRate,
      totalQuantity,
      currency: currencyCode,
      shippingAddress,
      billingAddress,
      couponCode: appliedCouponCode || "",
      creditsUsed: finalCreditAppliedBase,
      creditsDeducted: false,
      creditsRestored: false,
      price: {
        total: totalAmountValue,
        payableTotal: payableTotal,
        subtotal: display.subtotal.amount,
        shippingCharges: display.shippingCharges.amount,
        extraCharges: display.extraCharges.amount,
        couponDiscount: display.couponDiscount.amount,
        creditApplied,
      },
      temp: {
        ...(payableTotal > 0
          ? {}
          : { paymentSource: "wallet_credit", fullyCoveredByCredits: true }),
        amountAudit: audit,
        amountBase: base,
        amountMismatches: audit.mismatches || [],
        stripeExpectedAmount: finalAmount,
      },
    };

    if (giftCardOrder) {
      // Calculate high-precision USD amount for the gift card
      // 1 LOCAL = RATE USD, so USD = LOCAL * RATE
      const highPrecisionUsdAmount = Number(giftCardPurchase?.amount || 0) * currencyRate;

      orderData.temp = {
        ...orderData.temp,
        purchaseType: "gift-card",
        giftCardPurchase: {
          name: giftCardPurchase?.name || "",
          amount: highPrecisionUsdAmount, // High precision USD
          amountInCurrency: Number(giftCardPurchase?.amount || 0),
          currency: currencyCode,
        },
      };
    }

    const order = new Order(orderData);

    // PATH 1: CARD PAYMENT
    if (finalAmount > 0) {
      const successUrl = giftCardOrder 
        ? `${frontendBaseUrl}gift-card-success/${orderId}`
        : `${frontendBaseUrl}order-success/${orderId}`;

      const cancelUrl = giftCardOrder
        ? `${frontendBaseUrl}gift-card-cancel`
        : `${frontendBaseUrl}cancel`;

      const customerEmail =
        user?.email ||
        req.body?.guestEmail ||
        req.verifiedCheckoutEmail ||
        orderData?.shippingAddress?.email ||
        undefined;

      const stripeSessionParams = {
        payment_method_types: ["card"],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          orderId,
          userId: String(req.user.id),
          expectedAmount: String(finalAmount),
          currency: currencyCode,
        },
        line_items: [
          {
            price_data: {
              currency: currencyCode.toLowerCase(),
              product_data: {
                name: "Order Total",
                description: "Includes applied discounts and credits",
              },
              unit_amount: finalAmount,
            },
            quantity: 1,
          },
        ],
      };

      if (customerEmail) {
        stripeSessionParams.customer_email = customerEmail;
      }

      const stripeSession = await stripe.checkout.sessions.create(stripeSessionParams);

      order.stripeSessionId = stripeSession.id;
      await order.save();

      return res.json({
        id: stripeSession.id,
        url: stripeSession.url,
        livemode: stripeSession.livemode,
        stripeMode,
        orderId,
        creditsUsed: finalCreditAppliedBase,
        amountSummary: audit.backend,
        amountMismatches: audit.mismatches || [],
      });
    }

    // PATH 2: CREDIT-ONLY PAYMENT
    if (finalCreditAppliedBase > 0) {
      const dbSession = await safeStartSession();
      try {
        await deductCreditsFromUser(
          req.user.id,
          finalCreditAppliedBase,
          dbSession,
          order._id,
          { currency: currencyCode, amount: creditApplied },
        );
        order.creditsDeducted = true;
        await order.save({ session: dbSession });
        await safeCommitTransaction(dbSession);
      } catch (innerError) {
        await safeAbortTransaction(dbSession);
        throw innerError;
      } finally {
        safeEndSession(dbSession);
      }
    } else {
      await order.save();
    }

    const savedOrder = await Order.findById(order._id);

    if (giftCardOrder) {
      try {
        await recordCouponUsageForOrder(savedOrder);
        await issueGiftCardForOrder(savedOrder);
      } catch (giftCardError) {
        console.error("[GIFT_CARD] Failed to issue gift card", {
          orderId,
          error: giftCardError.message,
        });
      }
    } else {
      try {
        await deductStockForOrder(savedOrder);
        await Order.findByIdAndUpdate(savedOrder._id, {
          $set: { stockAdjusted: true },
        });
        await recordCouponUsageForOrder(savedOrder);
        await syncPaidOrderToJura(savedOrder);
      } catch (postPaymentError) {
        console.error("[ORDER_SUCCESS] Credit-only post-processing failed", {
          orderId,
          error: postPaymentError.message,
        });
      }
    }

    const finalOrder = await Order.findById(order._id);

    if (!giftCardOrder) {
      sendOrderConfirmationEmail(finalOrder || savedOrder, user).catch(console.error);
    }

    return res.status(200).json({
      success: true,
      paidWithCredits: true,
      orderId,
      order: finalOrder,
      data: { orderId },
    });
  } catch (error) {
    if (error instanceof CheckoutAmountMismatchError) {
      console.error("[PAYMENT_AMOUNT_MISMATCH]", error.details);
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
      });
    }

    console.error("[PAYMENT_ERROR]", error);
    res.status(error.statusCode || 500).json({ error: sanitizePaymentError(error) });
  }
};


const createTestPaymentIntent = async (req, res) => {
  try {
    const isTestKey = (process.env.STRIPE_TEST_SECRET_KEY || "").startsWith(
      "sk_test_",
    );
    const allowLiveTest = process.env.ALLOW_LIVE_PAYMENT_TEST === "true";

    if (!isTestKey && !allowLiveTest) {
      return res.status(400).json({
        error:
          "Stripe secret key is live. Set ALLOW_LIVE_PAYMENT_TEST=true only if you intend to create a live checkout session for manual verification.",
        livemode: true,
      });
    }

    const sampleProduct = {
      _id: "000000000000000000000001",
      productName: { en: "Test Product" },
      price: 1,
      discount: 0,
      sku: "TEST-001",
    };

    const sampleBody = {
      products: [{ product: sampleProduct, quantity: 1 }],
      shippingAddress: {
        street_address: "Test Street",
        city: "Dubai",
        state: "Dubai",
        postalCode: "00000",
        country: "AE",
      },
      billingAddress: {
        street_address: "Test Street",
        city: "Dubai",
        state: "Dubai",
        postalCode: "00000",
        country: "AE",
      },
      shippingCharges: 0,
    };

    const mockReq = { ...req, body: { ...sampleBody, ...(req.body || {}) } };
    return createPaymentIntent(mockReq, res);
  } catch (error) {
    res.status(500).json({ error: sanitizePaymentError(error) });
  }
};

const restoreCreditsForOrderIfNeeded = async (
  order,
  reason = "Payment not completed",
) => {
  if (
    !order ||
    !order.creditsDeducted ||
    order.creditsRestored ||
    normalizeAmount(order.creditsUsed) <= 0
  ) {
    return order;
  }

  await restoreCreditsToUser(order.userId, order.creditsUsed, null, order._id, {
    currency: order.currency,
    amount: order.price?.creditApplied,
  });

  return Order.findByIdAndUpdate(
    order._id,
    {
      $set: {
        creditsRestored: true,
        creditsDeducted: false,
        temp: {
          ...(order.temp || {}),
          creditsRestoredAt: new Date().toISOString(),
          creditsRestoreReason: reason,
        },
      },
    },
    { new: true },
  );
};

const orderCreation = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (!session.metadata || !session.metadata.orderId)
        return res.status(400).json({ error: "Order ID missing" });

      const { orderId } = session.metadata;
      const existingOrder = await Order.findOne({ orderId });
      if (!existingOrder)
        return res.status(404).json({ error: "Order not found" });

      if (
        session.payment_status === "paid" &&
        !validateStripeSessionAmount(existingOrder, session, "webhook")
      ) {
        await markOrderAmountMismatch(existingOrder, session, "webhook");
        return res.status(200).json({ received: true, amountMismatch: true });
      }

      // If card payment is successful, deduct credits now if they haven't been deducted yet
      if (
        session.payment_status === "paid" &&
        existingOrder.creditsUsed > 0 &&
        !existingOrder.creditsDeducted
      ) {
        try {
          await deductCreditsFromUser(
            existingOrder.userId,
            existingOrder.creditsUsed,
            null,
            existingOrder._id,
            {
              currency: existingOrder.currency,
              amount: existingOrder.price?.creditApplied,
            },
          );
          existingOrder.creditsDeducted = true;
          await existingOrder.save();
        } catch (deductError) {
          console.error(
            "[WEBHOOK] Failed to deduct credits for successful order",
            { orderId, error: deductError.message },
          );
        }
      }

      const order = await Order.findOneAndUpdate(
        { _id: existingOrder._id },
        {
          $set: {
            paymentStatus:
              session.payment_status === "paid" ? "Paid" : "Failed",
            status:
              session.payment_status === "paid" ? "Processing" : "Pending",
            paymentIntentId: session.payment_intent || null,
            stripeSessionId: session.id,
            temp: { ...(existingOrder.temp || {}), stripeSession: session },
          },
        },
        { new: true },
      );

      if (!order) return res.status(404).json({ error: "Order not found" });

      if (session.payment_status !== "paid") {
        await restoreCreditsForOrderIfNeeded(
          order,
          `Stripe checkout completed with payment status ${session.payment_status}`,
        );
      }

      const giftCardOrder =
        order?.temp?.purchaseType === "gift-card" ||
        !!order?.temp?.giftCardPurchase ||
        order?.products?.some((item) => item?.sku === "gift-card");

      if (session.payment_status === "paid" && giftCardOrder) {
        try {
          await recordCouponUsageForOrder(order);
          await issueGiftCardForOrder(order);
        } catch (giftCardError) {
          console.error("[GIFT_CARD] Failed to issue gift card from webhook", {
            orderId: order.orderId,
            error: giftCardError.message,
          });
        }
        return res.status(200).json({ received: true });
      }

      if (session.payment_status === "paid" && !order.stockAdjusted) {
        try {
          await deductStockForOrder(order);
          await Order.findByIdAndUpdate(order._id, {
            $set: { stockAdjusted: true },
          });
          await recordCouponUsageForOrder(order);
        } catch (stockError) {
          console.error("[ORDER_STOCK] Failed to deduct stock", {
            orderId: order.orderId,
            error: stockError.message,
          });
        }
      }

      if (session.payment_status === "paid" && !order.depoter_order_id) {
        try {
          await syncPaidOrderToJura(order);
        } catch (juraError) {
          const juraResponseData = juraError?.response?.data || null;
          await Order.findByIdAndUpdate(order._id, {
            $set: {
              depoterSyncStatus: "Failed",
              depoterSyncError:
                juraResponseData?.message ||
                juraResponseData?.error ||
                juraError.message ||
                "Failed to sync with Jura",
            },
          });
        }
      }

      if (session.payment_status === "paid" && !giftCardOrder) {
        const latestOrder = await Order.findById(order._id);
        sendOrderConfirmationEmail(latestOrder || order).catch(console.error);
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const orderId = session?.metadata?.orderId;
      if (orderId) {
        const order = await Order.findOne({ orderId });
        if (order) {
          const restoredOrder = await restoreCreditsForOrderIfNeeded(
            order,
            "Stripe checkout session expired",
          );
          await Order.findByIdAndUpdate(restoredOrder?._id || order._id, {
            $set: { status: "Pending", paymentStatus: "Failed" },
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const refreshPaymentStatus = async (req, res) => {
  try {
    if (!stripe)
      return res
        .status(500)
        .json({
          success: false,
          message: `Stripe is not configured for ${stripeMode} mode`,
        });

    const { orderId } = req.params;
    const order = await Order.findOne({ orderId, userId: req.user.id });

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (order.mode !== "card")
      return res
        .status(200)
        .json({
          success: true,
          message: "Order is not a card payment",
          data: order,
        });

    const giftCardOrder =
      order?.temp?.purchaseType === "gift-card" ||
      !!order?.temp?.giftCardPurchase ||
      order?.products?.some((item) => item?.sku === "gift-card");

    if (!order.stripeSessionId)
      return res
        .status(400)
        .json({
          success: false,
          message: "Stripe session ID is missing",
          data: order,
        });

    const session = await stripe.checkout.sessions.retrieve(
      order.stripeSessionId,
    );

    let updatedOrder = order;

    if (session.payment_status === "paid") {
      if (!validateStripeSessionAmount(order, session, "refresh")) {
        updatedOrder = await markOrderAmountMismatch(order, session, "refresh");
        return res.status(409).json({
          success: false,
          message: "Payment amount mismatch. Order was not marked as paid.",
          data: updatedOrder,
        });
      }

      // If card payment is successful, deduct credits now if they haven't been deducted yet
      if (order.creditsUsed > 0 && !order.creditsDeducted) {
        try {
          await deductCreditsFromUser(
            order.userId,
            order.creditsUsed,
            null,
            order._id,
            { currency: order.currency, amount: order.price?.creditApplied },
          );
          order.creditsDeducted = true;
          await order.save();
        } catch (deductError) {
          console.error("[REFRESH] Failed to deduct credits", {
            orderId,
            error: deductError.message,
          });
        }
      }

      updatedOrder = await Order.findOneAndUpdate(
        { _id: order._id },
        {
          $set: {
            paymentStatus: "Paid",
            status: "Processing",
            paymentIntentId:
              session.payment_intent || order.paymentIntentId || null,
            temp: {
              ...(order.temp || {}),
              stripeStatusRefreshAt: new Date().toISOString(),
              stripeSessionStatus: session.status,
              stripePaymentStatus: session.payment_status,
            },
          },
        },
        { new: true },
      );

      if (giftCardOrder) {
        try {
          await recordCouponUsageForOrder(updatedOrder);
          await issueGiftCardForOrder(updatedOrder);
        } catch (giftCardError) {
          console.error(
            "[GIFT_CARD] Failed to issue gift card during refresh",
            { orderId: updatedOrder.orderId, error: giftCardError.message },
          );
        }
        return res
          .status(200)
          .json({
            success: true,
            message: "Order payment status refreshed successfully",
            data: updatedOrder,
          });
      }

      if (!updatedOrder.stockAdjusted) {
        await deductStockForOrder(updatedOrder);
        updatedOrder = await Order.findOneAndUpdate(
          { _id: updatedOrder._id },
          { $set: { stockAdjusted: true } },
          { new: true },
        );
        await recordCouponUsageForOrder(updatedOrder);
      }

      if (!updatedOrder.depoter_order_id) {
        try {
          await syncPaidOrderToJura(updatedOrder);
          updatedOrder = await Order.findById(updatedOrder._id);
        } catch (juraError) {
          const juraResponseData = juraError?.response?.data || null;
          await Order.findByIdAndUpdate(updatedOrder._id, {
            $set: {
              depoterSyncStatus: "Failed",
              depoterSyncError:
                juraResponseData?.message ||
                juraResponseData?.error ||
                juraError.message ||
                "Failed to sync with Jura",
            },
          });
          updatedOrder = await Order.findById(updatedOrder._id);
        }
      }

      if (!giftCardOrder) {
        sendOrderConfirmationEmail(updatedOrder).catch(console.error);
      }
    } else if (
      session.status === "expired" ||
      session.payment_status === "unpaid"
    ) {
      updatedOrder = await restoreCreditsForOrderIfNeeded(
        updatedOrder,
        `Stripe session ${session.status || session.payment_status}`,
      );
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Order payment status refreshed successfully",
        data: updatedOrder,
      });
  } catch (error) {
    console.error("[ORDER_REFRESH] Failed", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to refresh payment status",
        error: error.message,
      });
  }
};

const refreshPaymentStatusPublic = async (req, res) => {
  try {
    if (!stripe)
      return res
        .status(500)
        .json({
          success: false,
          message: `Stripe is not configured for ${stripeMode} mode`,
        });

    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (order.mode !== "card")
      return res
        .status(200)
        .json({
          success: true,
          message: "Order is not a card payment",
          data: order,
        });

    const giftCardOrder =
      order?.temp?.purchaseType === "gift-card" ||
      !!order?.temp?.giftCardPurchase ||
      order?.products?.some((item) => item?.sku === "gift-card");

    if (!order.stripeSessionId)
      return res
        .status(400)
        .json({
          success: false,
          message: "Stripe session ID is missing",
          data: order,
        });

    const session = await stripe.checkout.sessions.retrieve(
      order.stripeSessionId,
    );

    let updatedOrder = order;

    if (session.payment_status === "paid") {
      if (!validateStripeSessionAmount(order, session, "refresh")) {
        updatedOrder = await markOrderAmountMismatch(order, session, "refresh");
        return res.status(409).json({
          success: false,
          message: "Payment amount mismatch. Order was not marked as paid.",
          data: updatedOrder,
        });
      }

      // If card payment is successful, deduct credits now if they haven't been deducted yet
      if (order.creditsUsed > 0 && !order.creditsDeducted) {
        try {
          await deductCreditsFromUser(
            order.userId,
            order.creditsUsed,
            null,
            order._id,
            { currency: order.currency, amount: order.price?.creditApplied },
          );
          order.creditsDeducted = true;
          await order.save();
        } catch (deductError) {
          console.error("[REFRESH] Failed to deduct credits", {
            orderId,
            error: deductError.message,
          });
        }
      }

      updatedOrder = await Order.findOneAndUpdate(
        { _id: order._id },
        {
          $set: {
            paymentStatus: "Paid",
            status: "Processing",
            paymentIntentId:
              session.payment_intent || order.paymentIntentId || null,
            temp: {
              ...(order.temp || {}),
              stripeStatusRefreshAt: new Date().toISOString(),
              stripeSessionStatus: session.status,
              stripePaymentStatus: session.payment_status,
            },
          },
        },
        { new: true },
      );

      if (giftCardOrder) {
        try {
          await recordCouponUsageForOrder(updatedOrder);
          await issueGiftCardForOrder(updatedOrder);
        } catch (giftCardError) {
          console.error(
            "[GIFT_CARD] Failed to issue gift card during refresh",
            { orderId: updatedOrder.orderId, error: giftCardError.message },
          );
        }
        return res
          .status(200)
          .json({
            success: true,
            message: "Order payment status refreshed successfully",
            data: updatedOrder,
          });
      }

      if (!updatedOrder.stockAdjusted) {
        await deductStockForOrder(updatedOrder);
        updatedOrder = await Order.findOneAndUpdate(
          { _id: updatedOrder._id },
          { $set: { stockAdjusted: true } },
          { new: true },
        );
        await recordCouponUsageForOrder(updatedOrder);
      }

      if (!updatedOrder.depoter_order_id) {
        try {
          await syncPaidOrderToJura(updatedOrder);
          updatedOrder = await Order.findById(updatedOrder._id);
        } catch (juraError) {
          const juraResponseData = juraError?.response?.data || null;
          await Order.findByIdAndUpdate(updatedOrder._id, {
            $set: {
              depoterSyncStatus: "Failed",
              depoterSyncError:
                juraResponseData?.message ||
                juraResponseData?.error ||
                juraError.message ||
                "Failed to sync with Jura",
            },
          });
          updatedOrder = await Order.findById(updatedOrder._id);
        }
      }

      if (!giftCardOrder) {
        sendOrderConfirmationEmail(updatedOrder).catch(console.error);
      }
    } else if (
      session.status === "expired" ||
      session.payment_status === "unpaid"
    ) {
      updatedOrder = await restoreCreditsForOrderIfNeeded(
        updatedOrder,
        `Stripe session ${session.status || session.payment_status}`,
      );
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Order payment status refreshed successfully",
        data: updatedOrder,
      });
  } catch (error) {
    console.error("[ORDER_REFRESH] Failed", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to refresh payment status",
        error: error.message,
      });
  }
};


module.exports = {
  createPaymentIntent,
  createTestPaymentIntent,
  orderCreation,
  refreshPaymentStatus,
  refreshPaymentStatusPublic,
};
