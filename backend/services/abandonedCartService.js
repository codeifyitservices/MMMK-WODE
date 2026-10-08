const crypto = require("crypto");
const mongoose = require("mongoose");
const AbandonedCartRecovery = require("../Models/AbandonedCartRecovery");
const Cart = require("../Models/Cart");
const User = require("../Models/User");
const Coupon = require("../Models/coupon");
const Order = require("../Models/Order");
const EmailTemplate = require("../Models/EmailTemplate");
const config = require("../Config/abandonedCartConfig");
const { sendMail } = require("./mailService");
const {
  buildStage6hEmail,
  buildStage12hEmail,
  buildStage24hCouponEmail,
  buildStage48hFinalEmail,
} = require("../utils/emailTemplates/abandonedCartTemplates");

/**
 * Helper to compute public logo URL
 */
const getLogoUrl = () => {
  const BACKEND_URL = process.env.BACKEND_URL || "";
  const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.mmmkwode.com";
  return (
    process.env.LOGO_URL ||
    (BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, "")}/uploads/brand-logo.png` : null) ||
    `${FRONTEND_URL.replace(/\/$/, "")}/Wode%20Logo.png`
  );
};

/**
 * Helper to get absolute cart URL
 */
const getCartUrl = () => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${FRONTEND_URL.replace(/\/$/, "")}/shopping-cart`;
};

/**
 * Helper to get absolute recovery claim URL
 */
const getClaimUrl = (token) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${FRONTEND_URL.replace(/\/$/, "")}/cart/recover?token=${token}`;
};

/**
 * Synchronizes and updates the abandoned cart tracking record when meaningful cart activity occurs.
 * ONLY called on actual cart modifications (add item, change qty, remove item, restore item).
 *
 * @param {string|ObjectId} userId
 */
async function trackCartActivity(userId) {
  try {
    if (!userId) return null;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const user = await User.findById(userObjectId).select("firstName lastName email");
    if (!user || !user.email) return null;

    // Fetch current active cart items
    const activeCartItems = await Cart.find({ user: userObjectId, type: "Active" }).populate("product");

    if (!activeCartItems.length) {
      // Cart is now empty -> cancel any ongoing recovery sequence
      return onCartEmptied(userId);
    }

    let cartValue = 0;
    let totalQuantity = 0;
    const cartSnapshot = activeCartItems.map((item) => {
      const product = item.product || {};
      const discount = Number(product.discount || 0);
      const rawPrice = Number(product.price || 0);
      const unitPrice = discount > 0 ? rawPrice - (rawPrice * discount) / 100 : rawPrice;
      const qty = Number(item.quantity || 1);
      const lineTotal = unitPrice * qty;

      cartValue += lineTotal;
      totalQuantity += qty;

      const imgUrl = product.images?.[0]?.url || product.images?.[0] || null;

      return {
        product: product._id || item.product,
        name: product.productName?.en || product.productName || "Product",
        sku: item.sku || "",
        quantity: qty,
        price: unitPrice,
        image: imgUrl,
        filters: item.filters || {},
      };
    });

    const now = new Date();

    // Upsert the recovery tracking document for this user's active cart session
    const recovery = await AbandonedCartRecovery.findOneAndUpdate(
      {
        user: userObjectId,
        status: { $in: ["ACTIVE", "IDLE", "ABANDONED"] },
      },
      {
        $set: {
          user: userObjectId,
          email: user.email,
          cartSnapshot,
          totalQuantity,
          cartValue: Number(cartValue.toFixed(2)),
          currency: "AED",
          lastActivityAt: now,
          status: "ACTIVE",
          markedIdleAt: null,
          currentStage: "ACTIVE",
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return recovery;
  } catch (err) {
    console.error("[AbandonedCartService] trackCartActivity error:", err.message);
    return null;
  }
}

/**
 * Called when cart is emptied by customer.
 */
async function onCartEmptied(userId) {
  try {
    if (!userId) return;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await AbandonedCartRecovery.updateMany(
      {
        user: userObjectId,
        status: { $in: ["ACTIVE", "IDLE", "ABANDONED"] },
      },
      {
        $set: {
          status: "CANCELLED",
          currentStage: "COMPLETED",
        },
        $push: {
          logs: {
            stage: "CART_EMPTIED",
            sentAt: new Date(),
            status: "SUCCESS",
            error: "Cart was emptied by user",
          },
        },
      }
    );
  } catch (err) {
    console.error("[AbandonedCartService] onCartEmptied error:", err.message);
  }
}

/**
 * Called when user successfully completes/pays for an order.
 */
async function onOrderCompleted(userId, order) {
  try {
    if (!userId) return;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await AbandonedCartRecovery.updateMany(
      {
        user: userObjectId,
        status: { $in: ["ACTIVE", "IDLE", "ABANDONED"] },
      },
      {
        $set: {
          status: "RECOVERED",
          currentStage: "COMPLETED",
          recoveredOrderId: order?._id || null,
          recoveredAt: new Date(),
        },
        $push: {
          logs: {
            stage: "CONVERTED_ORDER",
            sentAt: new Date(),
            status: "SUCCESS",
            error: `Converted to order #${order?.orderId || order?._id}`,
          },
        },
      }
    );
  } catch (err) {
    console.error("[AbandonedCartService] onOrderCompleted error:", err.message);
  }
}

/**
 * Live pre-send verification gatekeeper.
 * Verifies live cart is not empty and no recent order was placed.
 */
async function verifyCartStillAbandoned(recovery) {
  try {
    if (!recovery || !recovery.user) return false;

    // 1. Check live cart items
    const liveItems = await Cart.find({ user: recovery.user, type: "Active" });
    if (!liveItems.length) {
      await onCartEmptied(recovery.user);
      return false;
    }

    // 2. Check if an order was placed after last activity
    const recentOrder = await Order.findOne({
      userId: recovery.user,
      createdAt: { $gte: recovery.lastActivityAt },
      paymentStatus: { $in: ["Paid", "Pending"] },
    });

    if (recentOrder) {
      await onOrderCompleted(recovery.user, recentOrder);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[AbandonedCartService] verifyCartStillAbandoned error:", err.message);
    return false;
  }
}

/**
 * Core Recovery Scheduler Processor.
 * Evaluates all carts and triggers eligible 2h idle, 6h, 12h, 24h coupon, and 48h stages.
 */
async function processAbandonedCarts() {
  const now = new Date();
  const logoUrl = getLogoUrl();
  const cartUrl = getCartUrl();

  const results = {
    idleMarked: 0,
    stage6hSent: 0,
    stage12hSent: 0,
    stage24hSent: 0,
    stage48hSent: 0,
    errors: [],
  };

  try {
    // -------------------------------------------------------------
    // STEP 1: Mark carts as IDLE after 2 hours of inactivity
    // -------------------------------------------------------------
    const idleCutoff = new Date(now.getTime() - config.DELAYS.IDLE_MS);
    const idleCandidates = await AbandonedCartRecovery.find({
      status: "ACTIVE",
      lastActivityAt: { $lte: idleCutoff },
    });

    for (const rec of idleCandidates) {
      const stillValid = await verifyCartStillAbandoned(rec);
      if (stillValid) {
        await AbandonedCartRecovery.findByIdAndUpdate(rec._id, {
          $set: {
            status: "IDLE",
            markedIdleAt: now,
            currentStage: "IDLE",
          },
        });
        results.idleMarked++;
      }
    }

    // -------------------------------------------------------------
    // STEP 2: Stage 1 Reminder Email (6 Hours Total Inactivity)
    // -------------------------------------------------------------
    const stage6hCutoff = new Date(now.getTime() - config.DELAYS.STAGE_6H_MS);
    const stage6hCandidates = await AbandonedCartRecovery.find({
      status: { $in: ["IDLE", "ABANDONED"] },
      lastActivityAt: { $lte: stage6hCutoff },
      firstReminderSentAt: null,
    }).populate("user");

    for (const rec of stage6hCandidates) {
      // Atomic lock to prevent duplicate processing by concurrent workers
      const locked = await AbandonedCartRecovery.findOneAndUpdate(
        { _id: rec._id, firstReminderSentAt: null },
        { $set: { firstReminderSentAt: now, currentStage: "6H" } },
        { new: true }
      );
      if (!locked) continue;

      const stillValid = await verifyCartStillAbandoned(rec);
      if (!stillValid) continue;

      try {
        const user = rec.user || (await User.findById(rec.user));
        const customTemplate = await EmailTemplate.findOne({ type: "abandoned_cart_6h" });

        const { html, text, subject } = buildStage6hEmail({
          user,
          cartItems: rec.cartSnapshot,
          cartTotal: rec.cartValue,
          currency: rec.currency,
          cartUrl,
          logoUrl,
          customMessage: customTemplate?.customMessage,
        });

        await sendMail(rec.email, customTemplate?.subject || subject, text, html);

        await AbandonedCartRecovery.findByIdAndUpdate(rec._id, {
          $push: {
            logs: {
              stage: "6H",
              sentAt: now,
              email: rec.email,
              status: "SUCCESS",
            },
          },
        });
        results.stage6hSent++;
      } catch (err) {
        console.error(`[AbandonedCartService] Failed to send 6h email to ${rec.email}:`, err.message);
        await AbandonedCartRecovery.findByIdAndUpdate(rec._id, {
          $push: {
            logs: {
              stage: "6H",
              sentAt: now,
              email: rec.email,
              status: "FAILED",
              error: err.message,
            },
          },
        });
        results.errors.push({ stage: "6H", email: rec.email, error: err.message });
      }
    }

    // -------------------------------------------------------------
    // STEP 3: Stage 2 Reminder Email (12 Hours Total Inactivity)
    // -------------------------------------------------------------
    const stage12hCutoff = new Date(now.getTime() - config.DELAYS.STAGE_12H_MS);
    const stage12hCandidates = await AbandonedCartRecovery.find({
      status: { $in: ["IDLE", "ABANDONED"] },
      lastActivityAt: { $lte: stage12hCutoff },
      firstReminderSentAt: { $ne: null },
      secondReminderSentAt: null,
    }).populate("user");

    for (const rec of stage12hCandidates) {
      const locked = await AbandonedCartRecovery.findOneAndUpdate(
        { _id: rec._id, secondReminderSentAt: null },
        { $set: { secondReminderSentAt: now, currentStage: "12H" } },
        { new: true }
      );
      if (!locked) continue;

      const stillValid = await verifyCartStillAbandoned(rec);
      if (!stillValid) continue;

      try {
        const user = rec.user || (await User.findById(rec.user));
        const customTemplate = await EmailTemplate.findOne({ type: "abandoned_cart_12h" });

        const { html, text, subject } = buildStage12hEmail({
          user,
          cartItems: rec.cartSnapshot,
          cartTotal: rec.cartValue,
          currency: rec.currency,
          cartUrl,
          logoUrl,
          customMessage: customTemplate?.customMessage,
        });

        await sendMail(rec.email, customTemplate?.subject || subject, text, html);

        await AbandonedCartRecovery.findByIdAndUpdate(rec._id, {
          $push: {
            logs: {
              stage: "12H",
              sentAt: now,
              email: rec.email,
              status: "SUCCESS",
            },
          },
        });
        results.stage12hSent++;
      } catch (err) {
        console.error(`[AbandonedCartService] Failed to send 12h email to ${rec.email}:`, err.message);
        await AbandonedCartRecovery.findByIdAndUpdate(rec._id, {
          $push: {
            logs: {
              stage: "12H",
              sentAt: now,
              email: rec.email,
              status: "FAILED",
              error: err.message,
            },
          },
        });
        results.errors.push({ stage: "12H", email: rec.email, error: err.message });
      }
    }

    // -------------------------------------------------------------
    // STEP 4: Stage 3 Coupon Email (24 Hours Total Inactivity)
    // -------------------------------------------------------------
    const stage24hCutoff = new Date(now.getTime() - config.DELAYS.STAGE_24H_MS);
    const stage24hCandidates = await AbandonedCartRecovery.find({
      status: { $in: ["IDLE", "ABANDONED"] },
      lastActivityAt: { $lte: stage24hCutoff },
      couponEmailSentAt: null,
    }).populate("user");

    for (const rec of stage24hCandidates) {
      const locked = await AbandonedCartRecovery.findOneAndUpdate(
        { _id: rec._id, couponEmailSentAt: null },
        { $set: { couponEmailSentAt: now, currentStage: "24H" } },
        { new: true }
      );
      if (!locked) continue;

      const stillValid = await verifyCartStillAbandoned(rec);
      if (!stillValid) continue;

      try {
        const user = rec.user || (await User.findById(rec.user));

        // Generate customer-specific recovery coupon
        const couponSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
        const couponCode = `RECOVER-${couponSuffix}`;
        const couponExpiry = new Date(now.getTime() + config.COUPON.expiryDays * 24 * 60 * 60 * 1000);

        const createdCoupon = await Coupon.create({
          couponName: `Abandoned Cart Recovery Offer (${rec.email})`,
          couponCode: couponCode,
          discount: config.COUPON.discount,
          discountType: config.COUPON.discountType,
          expiryDate: couponExpiry,
          perUserLimit: 1,
          maxUsage: 1,
          currentUsage: 0,
          scope: config.COUPON.scope,
          applyToProducts: config.COUPON.applyToProducts,
          applyToDelivery: config.COUPON.applyToDelivery,
          showToUsers: false,
          assignedUser: user._id,
          isRecoveryCoupon: true,
        });

        // Generate cryptographically secure claim token
        const claimToken = crypto.randomBytes(config.CLAIM_TOKEN.tokenBytes).toString("hex");
        const claimTokenExpiresAt = new Date(now.getTime() + config.CLAIM_TOKEN.expiryHours * 60 * 60 * 1000);

        await AbandonedCartRecovery.findByIdAndUpdate(rec._id, {
          $set: {
            coupon: createdCoupon._id,
            couponCode: couponCode,
            claimToken: claimToken,
            claimTokenExpiresAt: claimTokenExpiresAt,
            isClaimed: false,
          },
        });

        const claimUrl = getClaimUrl(claimToken);
        const customTemplate = await EmailTemplate.findOne({ type: "abandoned_cart_24h" });

        const { html, text, subject } = buildStage24hCouponEmail({
          user,
          cartItems: rec.cartSnapshot,
          cartTotal: rec.cartValue,
          currency: rec.currency,
          claimUrl,
          discountPercent: config.COUPON.discount,
          expiryDays: config.COUPON.expiryDays,
          logoUrl,
          customMessage: customTemplate?.customMessage,
        });

        await sendMail(rec.email, customTemplate?.subject || subject, text, html);

        await AbandonedCartRecovery.findByIdAndUpdate(rec._id, {
          $push: {
            logs: {
              stage: "24H_COUPON",
              sentAt: now,
              email: rec.email,
              status: "SUCCESS",
            },
          },
        });
        results.stage24hSent++;
      } catch (err) {
        console.error(`[AbandonedCartService] Failed to generate/send 24h coupon to ${rec.email}:`, err.message);
        await AbandonedCartRecovery.findByIdAndUpdate(rec._id, {
          $push: {
            logs: {
              stage: "24H_COUPON",
              sentAt: now,
              email: rec.email,
              status: "FAILED",
              error: err.message,
            },
          },
        });
        results.errors.push({ stage: "24H", email: rec.email, error: err.message });
      }
    }

    // -------------------------------------------------------------
    // STEP 5: Stage 4 Final Reminder Email (48 Hours Total Inactivity)
    // -------------------------------------------------------------
    const stage48hCutoff = new Date(now.getTime() - config.DELAYS.STAGE_48H_MS);
    const stage48hCandidates = await AbandonedCartRecovery.find({
      status: { $in: ["IDLE", "ABANDONED"] },
      lastActivityAt: { $lte: stage48hCutoff },
      finalReminderSentAt: null,
    }).populate("user");

    for (const rec of stage48hCandidates) {
      const locked = await AbandonedCartRecovery.findOneAndUpdate(
        { _id: rec._id, finalReminderSentAt: null },
        { $set: { finalReminderSentAt: now, currentStage: "48H" } },
        { new: true }
      );
      if (!locked) continue;

      const stillValid = await verifyCartStillAbandoned(rec);
      if (!stillValid) continue;

      try {
        const user = rec.user || (await User.findById(rec.user));
        const customTemplate = await EmailTemplate.findOne({ type: "abandoned_cart_48h" });

        const { html, text, subject } = buildStage48hFinalEmail({
          user,
          cartItems: rec.cartSnapshot,
          cartTotal: rec.cartValue,
          currency: rec.currency,
          cartUrl,
          logoUrl,
          customMessage: customTemplate?.customMessage,
        });

        await sendMail(rec.email, customTemplate?.subject || subject, text, html);

        await AbandonedCartRecovery.findByIdAndUpdate(rec._id, {
          $push: {
            logs: {
              stage: "48H_FINAL",
              sentAt: now,
              email: rec.email,
              status: "SUCCESS",
            },
          },
        });
        results.stage48hSent++;
      } catch (err) {
        console.error(`[AbandonedCartService] Failed to send 48h email to ${rec.email}:`, err.message);
        await AbandonedCartRecovery.findByIdAndUpdate(rec._id, {
          $push: {
            logs: {
              stage: "48H_FINAL",
              sentAt: now,
              email: rec.email,
              status: "FAILED",
              error: err.message,
            },
          },
        });
        results.errors.push({ stage: "48H", email: rec.email, error: err.message });
      }
    }
  } catch (err) {
    console.error("[AbandonedCartService] processAbandonedCarts execution error:", err);
  }

  return results;
}

/**
 * Validates and claims a recovery coupon from an email link.
 *
 * @param {string} token - The secure claim token from the URL query
 * @param {string|ObjectId} [currentUserId] - Optional logged-in user ID
 */
async function claimRecoveryCoupon(token, currentUserId = null) {
  if (!token || typeof token !== "string") {
    const err = new Error("Recovery claim token is required");
    err.statusCode = 400;
    throw err;
  }

  const recovery = await AbandonedCartRecovery.findOne({ claimToken: token }).populate("coupon user");

  if (!recovery) {
    const err = new Error("Invalid or unknown recovery link");
    err.statusCode = 404;
    throw err;
  }

  // 1. Check if token already used
  if (recovery.isClaimed) {
    const err = new Error("This recovery offer has already been claimed");
    err.statusCode = 400;
    err.code = "ALREADY_CLAIMED";
    throw err;
  }

  // 2. Check token expiry
  if (recovery.claimTokenExpiresAt && new Date() > new Date(recovery.claimTokenExpiresAt)) {
    const err = new Error("This recovery offer link has expired");
    err.statusCode = 400;
    err.code = "TOKEN_EXPIRED";
    throw err;
  }

  // 3. Verify user matching if user is logged in
  if (currentUserId && String(recovery.user?._id || recovery.user) !== String(currentUserId)) {
    const err = new Error("This exclusive offer is assigned to a different account");
    err.statusCode = 403;
    err.code = "USER_MISMATCH";
    throw err;
  }

  // 4. Verify coupon validity
  const coupon = recovery.coupon;
  if (!coupon) {
    const err = new Error("Associated coupon offer not found");
    err.statusCode = 404;
    throw err;
  }

  if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
    const err = new Error("The recovery discount offer has expired");
    err.statusCode = 400;
    err.code = "COUPON_EXPIRED";
    throw err;
  }

  // Atomically claim the coupon
  const claimedNow = new Date();
  const updatedRecovery = await AbandonedCartRecovery.findOneAndUpdate(
    { _id: recovery._id, isClaimed: false },
    {
      $set: {
        isClaimed: true,
        claimedAt: claimedNow,
      },
      $push: {
        logs: {
          stage: "COUPON_CLAIMED",
          sentAt: claimedNow,
          status: "SUCCESS",
          error: "Coupon claimed via secure email link",
        },
      },
    },
    { new: true }
  );

  if (!updatedRecovery) {
    const err = new Error("This recovery offer was just claimed");
    err.statusCode = 400;
    err.code = "ALREADY_CLAIMED";
    throw err;
  }

  return {
    success: true,
    message: "Coupon successfully claimed!",
    couponCode: coupon.couponCode,
    discount: coupon.discount,
    discountType: coupon.discountType,
    expiryDate: coupon.expiryDate,
    assignedUser: recovery.user?._id || recovery.user,
    cartSnapshot: recovery.cartSnapshot,
  };
}

/**
 * Initializes the background scheduler.
 */
let schedulerInterval = null;
function startAbandonedCartScheduler() {
  if (schedulerInterval) return;

  const intervalSec = config.SCHEDULER_INTERVAL_MS / 1000;
  console.log(`[AbandonedCartService] Background scheduler started (Interval: ${intervalSec >= 60 ? `${intervalSec / 60}m` : `${intervalSec}s`})`);

  // Run initial pass after 10 seconds
  setTimeout(() => {
    processAbandonedCarts().catch((err) =>
      console.error("[AbandonedCartService] Initial scheduler pass error:", err)
    );
  }, 10000);

  // Periodic cron runner
  schedulerInterval = setInterval(() => {
    processAbandonedCarts().catch((err) =>
      console.error("[AbandonedCartService] Recurring scheduler error:", err)
    );
  }, config.SCHEDULER_INTERVAL_MS);
}

module.exports = {
  trackCartActivity,
  onCartEmptied,
  onOrderCompleted,
  processAbandonedCarts,
  claimRecoveryCoupon,
  startAbandonedCartScheduler,
};
