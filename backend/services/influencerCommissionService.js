const Influencer = require("../Models/Influencer");
const InfluencerClick = require("../Models/InfluencerClick");
const InfluencerWalletTransaction = require("../Models/InfluencerWalletTransaction");
const Order = require("../Models/Order");

/**
 * Handle commission credit when an order is created or reaches a completed/processing state.
 */
async function processOrderCommission(orderIdOrDoc) {
  try {
    let order = orderIdOrDoc;
    if (typeof orderIdOrDoc === "string" || !orderIdOrDoc.orderId) {
      order = await Order.findById(orderIdOrDoc);
    }

    if (!order || !order.influencerId) {
      return null;
    }

    // Only credit commission if not already credited and amount is greater than 0
    if (order.influencerCommissionStatus === "Earned") {
      return null;
    }

    const commissionAmount = Number(order.influencerCommissionAmount || 0);
    if (commissionAmount <= 0) {
      return null;
    }

    // Orders in Processing, Complete, or confirmed online payment trigger commission credit
    const eligibleStatuses = ["Processing", "Complete"];
    const isPaid = order.paymentMethod !== "cod" || eligibleStatuses.includes(order.status);

    if (!isPaid && order.status === "Pending") {
      // Mark as Pending commission until order is fulfilled/confirmed
      if (order.influencerCommissionStatus !== "Pending") {
        await Order.findByIdAndUpdate(order._id, {
          $set: { influencerCommissionStatus: "Pending" },
        });
      }
      return null;
    }

    const influencer = await Influencer.findById(order.influencerId);
    if (!influencer) {
      console.warn(`[InfluencerCommission] Influencer ${order.influencerId} not found for order ${order.orderId}`);
      return null;
    }

    const balanceBefore = influencer.walletBalance || 0;
    const balanceAfter = balanceBefore + commissionAmount;

    // Credit influencer's wallet
    influencer.walletBalance = balanceAfter;
    influencer.totalCommissionEarned = (influencer.totalCommissionEarned || 0) + commissionAmount;
    await influencer.save();

    // Create immutable ledger transaction
    const transaction = new InfluencerWalletTransaction({
      influencerId: influencer._id,
      type: "Commission_Credit",
      amount: commissionAmount,
      balanceBefore,
      balanceAfter,
      orderId: order._id,
      description: `Commission earned for Order #${order.orderId || order._id} (${influencer.commissionRate || 10}%)`,
      metadata: {
        orderTotal: order.price?.total || order.amount,
        orderId: order.orderId,
      },
    });
    await transaction.save();

    // Mark order as Earned
    await Order.findByIdAndUpdate(order._id, {
      $set: { influencerCommissionStatus: "Earned" },
    });

    // Mark associated click converted to order
    await InfluencerClick.updateMany(
      {
        influencerId: influencer._id,
        convertedToOrder: false,
      },
      {
        $set: {
          convertedToOrder: true,
          orderId: order._id,
        },
      }
    ).catch(() => {});

    console.log(
      `[InfluencerCommission] Credited AED ${commissionAmount} to ${influencer.fullName} (${influencer.referralCode}) for Order #${order.orderId}`
    );

    return { influencer, commissionAmount, transaction };
  } catch (error) {
    console.error("[InfluencerCommission] Error processing order commission:", error);
    return null;
  }
}

/**
 * Handle commission reversal if an order is cancelled or refunded.
 */
async function reverseOrderCommission(orderIdOrDoc, reason = "Order cancelled") {
  try {
    let order = orderIdOrDoc;
    if (typeof orderIdOrDoc === "string" || !orderIdOrDoc.orderId) {
      order = await Order.findById(orderIdOrDoc);
    }

    if (!order || !order.influencerId) {
      return null;
    }

    if (order.influencerCommissionStatus !== "Earned") {
      if (order.influencerCommissionStatus === "Pending") {
        await Order.findByIdAndUpdate(order._id, {
          $set: { influencerCommissionStatus: "Cancelled" },
        });
      }
      return null;
    }

    const commissionAmount = Number(order.influencerCommissionAmount || 0);
    const influencer = await Influencer.findById(order.influencerId);
    if (!influencer) {
      return null;
    }

    const balanceBefore = influencer.walletBalance;
    const balanceAfter = Math.max(0, balanceBefore - commissionAmount);

    influencer.walletBalance = balanceAfter;
    influencer.totalCommissionEarned = Math.max(
      0,
      (influencer.totalCommissionEarned || 0) - commissionAmount
    );
    await influencer.save();

    const transaction = new InfluencerWalletTransaction({
      influencerId: influencer._id,
      type: "Refund_Reversal",
      amount: -commissionAmount,
      balanceBefore,
      balanceAfter,
      orderId: order._id,
      description: `Reversal of commission for Order #${order.orderId} (${reason})`,
    });
    await transaction.save();

    await Order.findByIdAndUpdate(order._id, {
      $set: { influencerCommissionStatus: "Cancelled" },
    });

    return { influencer, reversedAmount: commissionAmount };
  } catch (error) {
    console.error("[InfluencerCommission] Error reversing order commission:", error);
    return null;
  }
}

module.exports = {
  processOrderCommission,
  reverseOrderCommission,
};
