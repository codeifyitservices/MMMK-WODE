const axios = require("axios");
const mongoose = require("mongoose");
const Order = require("../../Models/Order");
const Coupon = require("../../Models/coupon");
const User = require("../../Models/User");
const Product = require("../../Models/Product");
const {
  percentageValue,
  generateUniqueOrderId,
} = require("../../utils/globalMethods");
const SKU = require("../../Models/sku");
const { localizeValue } = require("../../utils/localization");
const {
  sendOrderToJura,
  extractJuraOrderId,
} = require("../../utils/juraDelivery");
const {
  deductStockForOrder,
  validateStockAvailability,
} = require("../../utils/stockService");
const {
  normalizeAmount,
  resolveRequestedCredit,
  deductCreditsFromUser,
} = require("../../utils/creditService");
const {
  assertCouponUsableByUser,
  recordCouponUsageForOrder,
} = require("../../utils/couponUsage");
const { onOrderCompleted } = require("../../services/abandonedCartService");
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
const { sendOrderConfirmationEmail } = require("../../services/mailService");

const createRequestId = () =>
  `RE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const convertAmountToBase = (amount, currencyCode, currencyRate) => {
  const rate =
    currencyRate || CURRENCY_CONFIG?.[resolveCurrencyCode(currencyCode)]?.rate || 1;
  return Number((Number(amount || 0) / rate).toFixed(2));
};

const normalizeRequestItems = (requestItems = [], orderProducts = []) =>
  requestItems
    .map((item) => {
      const matchedOrderItem = orderProducts.find(
        (orderItem) =>
          String(orderItem?.id) === String(item?.productId) &&
          String(orderItem?.sku) === String(item?.sku)
      );

      if (!matchedOrderItem) return null;

      const requestedQuantity = Number(item?.quantity || 0);
      const purchasedQuantity = Number(matchedOrderItem?.quantity || 0);

      if (!requestedQuantity || requestedQuantity < 0) return null;
      if (requestedQuantity > purchasedQuantity) return null;

      return {
        productId: matchedOrderItem.id,
        sku: matchedOrderItem.sku,
        name: matchedOrderItem.name || "Product",
        quantity: requestedQuantity,
      };
    })
    .filter(Boolean);

const createOrder = async (req, res) => {
  try {
    const data = req.body;
    const orderId = generateUniqueOrderId();
    const lang = req.lang || "en";
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const checkout = await buildCheckoutCalculation({
      body: data,
      user,
      userId: req.user.id,
      lang,
      isGiftCardOrder: false,
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

    const payableTotal = display.payableTotal.amount;
    const creditApplied = display.creditApplied.amount;
    const creditAppliedBase = base.creditApplied;
    const totalAmount = display.totalBeforeCredits.amount;
    const paymentStatus = payableTotal > 0 ? "Pending" : "Paid";

    await validateStockAvailability(
      orderItems.map((item) => ({
        productId: item.id,
        sku: item.sku,
        quantity: item.quantity,
        name: item.name,
      }))
    );

    // Determine payment method
    let paymentMethod = "cod";
    if (creditApplied > 0) {
      paymentMethod = payableTotal > 0 ? "credits+cod" : "credits";
    }

    // Data to save in DB
    const dataToSave = {
      userId: req.user.id,
      status: "Pending",
      mode: "cod",
      paymentMethod,
      orderId,
      products: orderItems,
      paymentStatus,
      totalAmount,
      amountPaidOnline: 0,
      amountDueCOD: payableTotal,
      amount: totalAmount,
      amountUSD: base.totalBeforeCredits,
      currencyRate,
      totalQuantity: totalQuantity,
      currency: currencyCode,
      shippingAddress: data?.shippingAddress,
      billingAddress: data?.billingAddress,
      couponCode: appliedCouponCode,
      creditsUsed: creditAppliedBase,
      creditsDeducted: creditAppliedBase > 0,
      creditsRestored: false,
      price: {
        total: totalAmount,
        payableTotal: payableTotal,
        subtotal: display.subtotal.amount,
        shippingCharges: display.shippingCharges.amount,
        extraCharges: display.extraCharges.amount,
        couponDiscount: display.couponDiscount.amount,
        creditApplied,
      },
      stockAdjusted: false,
      temp: {
        amountAudit: audit,
        amountBase: base,
        amountMismatches: audit.mismatches || [],
      },
    };

    let createdOrder;
    if (creditAppliedBase > 0) {
      const session = await safeStartSession();

      try {
        createdOrder = new Order(dataToSave);
        await deductCreditsFromUser(
          req.user.id, 
          creditAppliedBase, 
          session, 
          createdOrder._id,
          { currency: currencyCode, amount: creditApplied }
        );
        createdOrder.creditsDeducted = true;
        await createdOrder.save({ session });
        await safeCommitTransaction(session);
      } catch (transactionError) {
        await safeAbortTransaction(session);
        throw transactionError;
      } finally {
        safeEndSession(session);
      }
    } else {
      createdOrder = new Order(dataToSave);
      await createdOrder.save();
    }

    await deductStockForOrder(createdOrder);
    await Order.findByIdAndUpdate(createdOrder._id, {
      $set: { stockAdjusted: true },
    });
    await recordCouponUsageForOrder(createdOrder);
    onOrderCompleted(req.user.id, createdOrder).catch(() => {});

    // Send to delivery provider (best-effort). If this fails, still return the created order to client
    let juraResponse = null;
    try {
      
      juraResponse = await sendOrderToJura(createdOrder);
      
      const juraOrderId =
        extractJuraOrderId(juraResponse) || createdOrder.orderId;

      await Order.findByIdAndUpdate(createdOrder._id, {
        $set: {
          depoter_order_id: juraOrderId,
          depoterSyncStatus: "Synced",
          depoterSyncedAt: new Date(),
          depoterSyncError: "",
          status: "Processing",
          temp: {
            ...(createdOrder.temp || {}),
            juraResponse,
            juraSyncedAt: new Date().toISOString(),
          },
        },
      });

      const syncedOrder = await Order.findById(createdOrder._id);

      // Fire order confirmation email — non-blocking
      sendOrderConfirmationEmail(syncedOrder || createdOrder, user).catch(console.error);

      return res.status(201).json({
        order: syncedOrder || {
          ...createdOrder.toObject(),
          depoter_order_id: juraOrderId,
          depoterSyncStatus: "Synced",
          status: "Processing",
          stockAdjusted: true,
        },
        success: true,
        juraResponse,
        data: createdOrder.orderId,
      });
    } catch (juraErr) {
      console.error(`Jura Sync Failed for order ${createdOrder.orderId}:`, juraErr.message || juraErr);
      const juraResponseData = juraErr?.response?.data || null;
      if (juraResponseData) {
        console.error("Jura error response details:", JSON.stringify(juraResponseData));
      }
      await Order.findByIdAndUpdate(createdOrder._id, {
        $set: {
          depoterSyncStatus: "Failed",
          depoterSyncError:
            juraResponseData?.message ||
            juraResponseData?.error ||
            (typeof juraResponseData === "string" ? juraResponseData : "") ||
            juraErr.message ||
            "Failed to sync with Jura",
        },
      });

      const failedSyncOrder = await Order.findById(createdOrder._id);

      // Fire order confirmation email even if Jura sync failed — non-blocking
      sendOrderConfirmationEmail(failedSyncOrder || createdOrder, user).catch(console.error);

      // Return created order even if delivery sync failed
      return res.status(201).json({
        order: failedSyncOrder || {
          ...createdOrder.toObject(),
          depoterSyncStatus: "Failed",
          stockAdjusted: true,
        },
        success: true,
        juraError: juraResponseData || juraErr.message,
        data: createdOrder.orderId,
      });
    }
  } catch (err) {
    if (err instanceof CheckoutAmountMismatchError) {
      console.error("[ORDER_AMOUNT_MISMATCH]", err.details);
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        details: err.details,
      });
    }

    console.error("Error creating order:", err);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.statusCode ? err.message : "Failed to create order",
      error: err.message,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { orderId, page = 1, limit = 10 } = req.query;
    const filter = { userId: req.user.id };
    
    // If a specific orderId is requested, show it regardless of status/mode
    if (orderId) {
      filter.orderId = { $regex: orderId, $options: "i" };
    } else {
      // Otherwise, hide pending card orders from the general list
      filter.$or = [
        { mode: { $ne: 'card' } },
        { mode: 'card', paymentStatus: 'Paid' }
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;
    
    // Optimized query: Select only needed fields and use lean for faster execution
    const data = await Order.find(filter)
      .select('orderId createdAt status mode price paymentStatus totalQuantity temp currency')
      .populate({
        path: "products.id",
        model: "Product",
        select: "productName images" // Only select needed fields from product
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error("Fetch orders error:", err);
    res.status(500).json({
      success: false, // Fixed typo: should be false on error
      message: "Failed to fetch orders",
    });
  }
};

const requestReturnExchange = async (req, res) => {
  try {
    const { orderId } = req.params;
    const {
      type,
      reason = "",
      notes = "",
      items = [],
      exchangeDetails = {},
    } = req.body || {};

    if (!["return", "exchange"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either return or exchange",
      });
    }

    if (!reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason is required",
      });
    }

    const order = await Order.findOne({ orderId, userId: req.user.id });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!["Processing", "Complete"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Return/exchange can only be requested for processed orders",
      });
    }

    const alreadyPending = (order.returnExchangeRequests || []).some(
      (request) =>
        request?.status === "Pending" || request?.status === "Approved"
    );

    if (alreadyPending) {
      return res.status(400).json({
        success: false,
        message: "There is already an active return/exchange request for this order",
      });
    }

    const normalizedItems = normalizeRequestItems(items, order.products || []);
    if (!normalizedItems.length) {
      return res.status(400).json({
        success: false,
        message:
          "At least one valid order item with quantity is required for return/exchange",
      });
    }

    const requestPayload = {
      requestId: createRequestId(),
      type,
      status: "Pending",
      reason: reason.trim(),
      notes: String(notes || "").trim(),
      items: normalizedItems,
      exchangeDetails: {
        requestedItems: normalizeRequestItems(
          exchangeDetails?.requestedItems || [],
          order.products || []
        ),
        notes: String(exchangeDetails?.notes || "").trim(),
      },
      requestedBy: req.user.id,
      requestedAt: new Date(),
      juraSyncStatus: "Pending",
    };

    order.returnExchangeRequests = [
      ...(order.returnExchangeRequests || []),
      requestPayload,
    ];

    await order.save();

    return res.status(201).json({
      success: true,
      message: "Return/exchange request submitted successfully",
      data: requestPayload,
    });
  } catch (err) {
    console.error("Error requesting return/exchange:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit return/exchange request",
    });
  }
};

module.exports = { createOrder, getOrders, requestReturnExchange, getOrderByIdPublic };

// ─── Public: look up a single order by its orderId string (no auth required) ──
// The orderId is a long unguessable string, so exposing it publicly is safe.
// Used by the order-success page for guest checkouts.
async function getOrderByIdPublic(req, res) {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const order = await Order.findOne({ orderId })
      .select(
        "orderId createdAt status mode price paymentStatus totalQuantity temp currency amount creditsUsed amountDueCOD amountPaidOnline jura_order_id depoter_order_id juraSyncStatus depoterSyncStatus juraSyncError depoterSyncError stripeSessionId"
      )
      .populate({
        path: "products.id",
        model: "Product",
        select: "productName images",
      })
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: [order], // array so frontend OrderSuccess page works the same way
    });
  } catch (err) {
    console.error("Public fetch order error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
}

