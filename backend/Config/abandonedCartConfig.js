/**
 * Abandoned Cart Configuration
 * All timings are managed on the server.
 */
module.exports = {
  // Timing delays in milliseconds
  DELAYS: {
    IDLE_MS: 2 * 60 * 60 * 1000,          // 2 hours: cart is marked as IDLE/ABANDONED
    STAGE_6H_MS: 6 * 60 * 60 * 1000,      // 6 hours total (4 hours after idle): Email #1
    STAGE_12H_MS: 12 * 60 * 60 * 1000,    // 12 hours total: Email #2
    STAGE_24H_MS: 24 * 60 * 60 * 1000,    // 24 hours total: 24h Coupon Email
    STAGE_48H_MS: 48 * 60 * 60 * 1000,    // 48 hours total: Final Reminder Email
  },

  // 24h Recovery Coupon Defaults
  COUPON: {
    discount: 10,                          // 10% discount
    discountType: "percentage",            // "percentage" or "amount"
    expiryDays: 3,                         // Coupon expires 3 days after generation
    perUserLimit: 1,                       // Usable once per customer
    maxUsage: 1,                           // Total single usage
    applyToProducts: true,
    applyToDelivery: false,
    scope: "All",
    showToUsers: false,                    // Private, not shown in public coupon listings
  },

  // Secure Claim Token Settings
  CLAIM_TOKEN: {
    expiryHours: 72,                       // Claim link valid for 72 hours
    tokenBytes: 32,                        // 256-bit cryptographically secure token
  },

  // Scheduler interval (checks every 10 minutes)
  SCHEDULER_INTERVAL_MS: 10 * 60 * 1000,
};
