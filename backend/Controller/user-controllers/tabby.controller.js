const Order = require("../../Models/Order");
const User = require("../../Models/User");
const { generateUniqueOrderId } = require("../../utils/globalMethods");
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
  deductCreditsFromUser,
  restoreCreditsToUser,
} = require("../../utils/creditService");
const { recordCouponUsageForOrder } = require("../../utils/couponUsage");
const { buildCheckoutCalculation } = require("../../utils/checkoutCalculator");
const {
  safeStartSession,
  safeCommitTransaction,
  safeAbortTransaction,
  safeEndSession,
} = require("../../utils/dbUtils");
const tabbyService = require("../../utils/tabbyService");
const { convertToCurrency } = require("../../utils/currency");

const getFrontendBaseUrl = () => {
  const url = process.env.FRONTEND_URL || "http://localhost:5173/";
  return url.endsWith("/") ? url : `${url}/`;
};

const TABBY_SUPPORTED_CURRENCIES = ["AED", "SAR", "KWD", "BHD", "EGP"];

const createTabbySession = async (req, res) => {
  try {
    const {
      products,
      shippingAddress,
      billingAddress,
      totalAmount,
      currency,
      currencyRate: requestedCurrencyRate,
    } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "No products provided" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const orderId = generateUniqueOrderId();
    const frontendBaseUrl = getFrontendBaseUrl();
    const lang = req.lang || "en";

    const checkout = await buildCheckoutCalculation({
      body: req.body,
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

    // Determine Tabby currency (convert to AED if original is unsupported)
    let tabbyCurrency = currencyCode;
    let isConverted = false;
    if (!TABBY_SUPPORTED_CURRENCIES.includes(currencyCode)) {
      tabbyCurrency = "AED";
      isConverted = true;
    }

    await validateStockAvailability(
      orderItems.map((item) => ({
        productId: item.id,
        sku: item.sku,
        quantity: item.quantity,
        name: item.name,
      }))
    );

    const payableTotal = display.payableTotal.amount;
    const creditApplied = display.creditApplied.amount;
    const finalCreditAppliedBase = base.creditApplied;

    let paymentMethod = "tabby";
    if (payableTotal > 0 && creditApplied > 0) {
      paymentMethod = "credits+tabby";
    }

    const orderData = {
      userId: req.user.id,
      status: "Pending",
      mode: "tabby",
      paymentMethod,
      orderId,
      products: orderItems,
      paymentStatus: "Pending",
      totalAmount: display.totalBeforeCredits.amount,
      amountPaidOnline: payableTotal,
      amountDueCOD: 0,
      amount: display.totalBeforeCredits.amount,
      amountUSD: base.totalBeforeCredits,
      currencyRate: currencyRate,
      totalQuantity,
      currency: currencyCode,
      shippingAddress,
      billingAddress,
      couponCode: appliedCouponCode || "",
      creditsUsed: finalCreditAppliedBase,
      creditsDeducted: false,
      price: {
        total: display.totalBeforeCredits.amount,
        payableTotal: payableTotal,
        subtotal: display.subtotal.amount,
        shippingCharges: display.shippingCharges.amount,
        extraCharges: display.extraCharges.amount,
        couponDiscount: display.couponDiscount.amount,
        creditApplied,
      },
      temp: {
        amountAudit: audit,
        amountBase: base,
      },
    };

    if (isConverted) {
      orderData.temp.tabbyConversion = {
        originalCurrency: currencyCode,
        targetCurrency: tabbyCurrency,
      };
    }

    const order = new Order(orderData);
    await order.save();

    // Prepare Tabby Payment Data with potentially converted currency
    let tabbyPayableTotal, tabbyShippingAmount, tabbyItems, tabbyDiscountAmount;

    if (isConverted) {
      tabbyPayableTotal = convertToCurrency(base.payableTotal, tabbyCurrency);
      tabbyShippingAmount = convertToCurrency(base.shippingCharges, tabbyCurrency);
      
      tabbyItems = orderItems.map((item) => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: convertToCurrency(item.amountBase / item.quantity, tabbyCurrency).toFixed(2),
        reference_id: item.sku,
      }));

      const itemsTotal = tabbyItems.reduce((acc, item) => acc + (parseFloat(item.unit_price) * item.quantity), 0);
      // Re-calculate discount to ensure absolute mathematical parity: items + shipping - discount = payable
      tabbyDiscountAmount = (itemsTotal + tabbyShippingAmount - tabbyPayableTotal).toFixed(2);
    } else {
      tabbyPayableTotal = payableTotal;
      tabbyShippingAmount = display.shippingCharges.amount;
      tabbyItems = orderItems.map((item) => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: (item.amount / item.quantity).toFixed(2),
        reference_id: item.sku,
      }));
      tabbyDiscountAmount = (display.couponDiscount.amount + creditApplied).toFixed(2);
    }

    const tabbyPaymentData = {
      payment: {
        amount: tabbyPayableTotal.toFixed(2),
        currency: tabbyCurrency,
        description: `Order #${orderId}`,
        buyer: {
          phone: shippingAddress.phoneNumber || user.contactNumber || "0000000000",
          email: user.email,
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        },
        shipping_address: {
          city: shippingAddress.city,
          address: shippingAddress.streetAddress,
          zip: shippingAddress.postalCode || "00000",
        },
        order: {
          tax_amount: "0.00",
          shipping_amount: tabbyShippingAmount.toFixed(2),
          discount_amount: tabbyDiscountAmount,
          updated_at: new Date().toISOString(),
          reference_id: orderId,
          items: tabbyItems,
        },
      },
      lang: lang,
      merchant_urls: {
        success: `${frontendBaseUrl}order-success/${orderId}?status=success`,
        cancel: `${frontendBaseUrl}cancel?status=cancel`,
        failure: `${frontendBaseUrl}cancel?status=failure`,
      },
    };

    let tabbySession;
    try {
      tabbySession = await tabbyService.createCheckoutSession(tabbyPaymentData);
    } catch (apiError) {
      await Order.findByIdAndDelete(order._id);
      const errorData = apiError.response?.data;
      console.error("[TABBY_API_ERROR]", JSON.stringify(errorData, null, 2));
      return res.status(400).json({
        error: "Failed to create Tabby session",
        details: errorData || apiError.message,
      });
    }

    // Look for the installments (Pay in 4) product
    const installmentsProduct = tabbySession.configuration.available_products.installments?.[0];
    
    if (!installmentsProduct) {
      // If Pay-in-4 is not available, return error
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({ error: "Tabby Pay-in-4 is not available for this order." });
    }

    order.tabbySessionId = tabbySession.id;
    order.tabbyPaymentId = tabbySession.payment.id;
    await order.save();

    return res.json({
      id: tabbySession.id,
      url: installmentsProduct.web_url,
      orderId,
      tabbyPaymentId: tabbySession.payment.id,
    });
  } catch (error) {
    console.error("[TABBY_SESSION_ERROR]", error);
    res.status(500).json({ error: error.message });
  }
};

const syncTabbyOrderToJura = async (order) => {
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

const handleTabbyWebhook = async (req, res) => {
  // Note: Tabby webhooks are sent as POST requests to the configured URL.
  // Verification usually involves checking the header if configured, but for now we'll implement the logic.
  try {
    const event = req.body;
    const { id: paymentId, status, order_reference_id: orderId } = event;

    if (!orderId) return res.status(400).json({ error: "Order ID missing" });

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (status === "authorized" || status === "captured") {
      if (order.paymentStatus === "Paid") {
        return res.status(200).json({ received: true });
      }

      // Successful payment logic
      const dbSession = await safeStartSession();
      try {
        if (order.creditsUsed > 0 && !order.creditsDeducted) {
          await deductCreditsFromUser(
            order.userId,
            order.creditsUsed,
            dbSession,
            order._id,
            { currency: order.currency, amount: order.price.creditApplied }
          );
          order.creditsDeducted = true;
        }

        order.paymentStatus = "Paid";
        order.status = "Processing";
        order.tabbyPaymentId = paymentId;
        
        await order.save({ session: dbSession });
        await safeCommitTransaction(dbSession);
      } catch (err) {
        await safeAbortTransaction(dbSession);
        throw err;
      } finally {
        safeEndSession(dbSession);
      }

      const updatedOrder = await Order.findById(order._id);

      // Post-payment background tasks
      if (!updatedOrder.stockAdjusted) {
        try {
          await deductStockForOrder(updatedOrder);
          await Order.findByIdAndUpdate(updatedOrder._id, { $set: { stockAdjusted: true } });
          await recordCouponUsageForOrder(updatedOrder);
        } catch (stockError) {
          console.error("[TABBY_WEBHOOK] Stock deduction failed", stockError);
        }
      }

      if (!updatedOrder.depoter_order_id) {
        try {
          await syncTabbyOrderToJura(updatedOrder);
        } catch (juraError) {
          const juraResponseData = juraError?.response?.data || null;
          console.error("[TABBY_WEBHOOK] Jura sync failed", {
            orderId: updatedOrder.orderId,
            error: juraError.message,
            responseData: juraResponseData
          });
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
        }
      }

      sendOrderConfirmationEmail(updatedOrder).catch(console.error);
    } else if (status === "closed" || status === "expired" || status === "rejected") {
      order.paymentStatus = "Failed";
      await order.save();
      
      if (order.creditsDeducted) {
        await restoreCreditsToUser(order.userId, order.creditsUsed, null, order._id, {
          currency: order.currency,
          amount: order.price.creditApplied,
        });
        order.creditsRestored = true;
        order.creditsDeducted = false;
        await order.save();
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[TABBY_WEBHOOK_ERROR]", error);
    res.status(500).json({ error: error.message });
  }
};

const refreshTabbyStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId, userId: req.user.id });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.mode !== "tabby") return res.status(200).json({ success: true, message: "Not a Tabby order", data: order });

    if (!order.tabbyPaymentId) return res.status(400).json({ success: false, message: "Tabby payment ID missing" });

    const tabbyPayment = await tabbyService.getPaymentDetails(order.tabbyPaymentId);
    const status = tabbyPayment.status;

    if (status === "authorized" || status === "captured") {
      if (order.paymentStatus !== "Paid") {
        // Successful payment logic
        const dbSession = await safeStartSession();
        try {
          if (order.creditsUsed > 0 && !order.creditsDeducted) {
            await deductCreditsFromUser(
              order.userId,
              order.creditsUsed,
              dbSession,
              order._id,
              { currency: order.currency, amount: order.price.creditApplied }
            );
            order.creditsDeducted = true;
          }

          order.paymentStatus = "Paid";
          order.status = "Processing";
          
          await order.save({ session: dbSession });
          await safeCommitTransaction(dbSession);
        } catch (err) {
          await safeAbortTransaction(dbSession);
          throw err;
        } finally {
          safeEndSession(dbSession);
        }
      }

      let updatedOrder = await Order.findById(order._id);

      // Trigger post-payment actions if needed
      if (!updatedOrder.stockAdjusted) {
        try {
          await deductStockForOrder(updatedOrder);
          await Order.findByIdAndUpdate(updatedOrder._id, { $set: { stockAdjusted: true } });
          await recordCouponUsageForOrder(updatedOrder);
          updatedOrder = await Order.findById(order._id);
        } catch (stockError) {
          console.error("[TABBY_REFRESH] Stock deduction failed", stockError);
        }
      }

      if (!updatedOrder.depoter_order_id) {
        try {
          await syncTabbyOrderToJura(updatedOrder);
          updatedOrder = await Order.findById(order._id);
        } catch (juraError) {
          const juraResponseData = juraError?.response?.data || null;
          console.error("[TABBY_REFRESH] Jura sync failed", {
            orderId: updatedOrder.orderId,
            error: juraError.message,
            responseData: juraResponseData
          });
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
          updatedOrder = await Order.findById(order._id);
        }
      }

      sendOrderConfirmationEmail(updatedOrder).catch(console.error);

      return res.status(200).json({
        success: true,
        message: "Order status refreshed",
        data: updatedOrder,
        tabbyStatus: status,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status refreshed",
      data: order,
      tabbyStatus: status,
    });
  } catch (error) {
    console.error("[TABBY_REFRESH_ERROR]", error);
    res.status(500).json({ error: error.message });
  }
};

const refreshTabbyStatusPublic = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.mode !== "tabby") return res.status(200).json({ success: true, message: "Not a Tabby order", data: order });

    if (!order.tabbyPaymentId) return res.status(400).json({ success: false, message: "Tabby payment ID missing" });

    const tabbyPayment = await tabbyService.getPaymentDetails(order.tabbyPaymentId);
    const status = tabbyPayment.status;

    if (status === "authorized" || status === "captured") {
      if (order.paymentStatus !== "Paid") {
        // Successful payment logic
        const dbSession = await safeStartSession();
        try {
          if (order.creditsUsed > 0 && !order.creditsDeducted) {
            await deductCreditsFromUser(
              order.userId,
              order.creditsUsed,
              dbSession,
              order._id,
              { currency: order.currency, amount: order.price.creditApplied }
            );
            order.creditsDeducted = true;
          }

          order.paymentStatus = "Paid";
          order.status = "Processing";
          
          await order.save({ session: dbSession });
          await safeCommitTransaction(dbSession);
        } catch (err) {
          await safeAbortTransaction(dbSession);
          throw err;
        } finally {
          safeEndSession(dbSession);
        }
      }

      let updatedOrder = await Order.findById(order._id);

      // Trigger post-payment actions if needed
      if (!updatedOrder.stockAdjusted) {
        try {
          await deductStockForOrder(updatedOrder);
          await Order.findByIdAndUpdate(updatedOrder._id, { $set: { stockAdjusted: true } });
          await recordCouponUsageForOrder(updatedOrder);
          updatedOrder = await Order.findById(order._id);
        } catch (stockError) {
          console.error("[TABBY_REFRESH] Stock deduction failed", stockError);
        }
      }

      if (!updatedOrder.depoter_order_id) {
        try {
          await syncTabbyOrderToJura(updatedOrder);
          updatedOrder = await Order.findById(order._id);
        } catch (juraError) {
          const juraResponseData = juraError?.response?.data || null;
          console.error("[TABBY_REFRESH] Jura sync failed", {
            orderId: updatedOrder.orderId,
            error: juraError.message,
            responseData: juraResponseData
          });
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
          updatedOrder = await Order.findById(order._id);
        }
      }

      sendOrderConfirmationEmail(updatedOrder).catch(console.error);

      return res.status(200).json({
        success: true,
        message: "Order status refreshed",
        data: updatedOrder,
        tabbyStatus: status,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status refreshed",
      data: order,
      tabbyStatus: status,
    });
  } catch (error) {
    console.error("[TABBY_REFRESH_ERROR]", error);
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  createTabbySession,
  handleTabbyWebhook,
  refreshTabbyStatus,
  refreshTabbyStatusPublic,
};
