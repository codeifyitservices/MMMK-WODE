const NewsletterSubscriber = require("../../Models/NewsletterSubscriber");
const NewsletterPopupSettings = require("../../Models/NewsletterPopupSettings");
const Coupon = require("../../Models/coupon");

// Basic email validation regex conforming to standard RFC specs
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Ensure coupon exists in MongoDB so customer can apply it at checkout
 */
const ensureCouponExists = async (settings) => {
  if (!settings.offerCoupon || !settings.discountCode) return null;
  const code = String(settings.discountCode).trim().toUpperCase();
  let coupon = await Coupon.findOne({ couponCode: code });
  if (!coupon) {
    coupon = await Coupon.create({
      couponName: `Newsletter VIP Voucher (${code})`,
      couponCode: code,
      discount: Number(settings.discountValue) || 15,
      discountType: settings.discountType === "amount" ? "amount" : "percentage",
      showToUsers: true,
      applyToProducts: true,
      applyToDelivery: false,
      scope: "All",
      perUserLimit: 1,
      maxUsage: null,
      expiryDate: null,
    });
  }
  return coupon;
};

/**
 * GET /api/v1/newsletter/popup-config
 * Returns active settings needed for the storefront popup
 */
const getPublicPopupConfig = async (req, res) => {
  try {
    const settings = await NewsletterPopupSettings.getSettings();

    // Ensure coupon exists in DB
    if (settings.offerCoupon && settings.discountCode) {
      await ensureCouponExists(settings);
    }

    const { email } = req.query;
    let isSubscribed = false;
    if (email && typeof email === "string" && email.trim()) {
      const existing = await NewsletterSubscriber.findOne({
        email: email.trim().toLowerCase(),
        status: "subscribed",
      });
      isSubscribed = Boolean(existing);
    }

    return res.status(200).json({
      success: true,
      data: {
        enabled: Boolean(settings.enabled),
        isSubscribed,
        title: settings.title || "JOIN THE MAISON MMMK WODE",
        subtitle:
          settings.subtitle ||
          "Enjoy exclusive privileges and receive private invitations to new releases.",
        offerCoupon: settings.offerCoupon !== false,
        discountCode: settings.offerCoupon !== false ? settings.discountCode : null,
        discountValue: Number(settings.discountValue) || 15,
        discountType: settings.discountType || "percentage",
        discountText: settings.discountText || "Use code at checkout for discount",
        buttonText: settings.buttonText || "CLAIM MY PRIVILEGE",
        delaySeconds: Number(settings.delaySeconds) || 6,
        displayFrequencyDays: Number(settings.displayFrequencyDays) || 7,
        backgroundImage: settings.backgroundImage || "",
      },
    });
  } catch (error) {
    console.error("[NewsletterController] getPublicPopupConfig error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load newsletter configuration.",
    });
  }
};

/**
 * GET /api/v1/newsletter/check-status
 * Checks if an email is actively subscribed in DB
 */
const checkSubscriberStatus = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(200).json({ success: true, isSubscribed: false });
    }
    const subscriber = await NewsletterSubscriber.findOne({
      email: email.trim().toLowerCase(),
      status: "subscribed",
    });
    return res.status(200).json({
      success: true,
      isSubscribed: Boolean(subscriber),
    });
  } catch (error) {
    console.error("[NewsletterController] checkSubscriberStatus error:", error);
    return res.status(200).json({ success: true, isSubscribed: false });
  }
};

/**
 * POST /api/v1/newsletter/subscribe
 * Subscribes a visitor email to the newsletter
 */
const subscribeNewsletter = async (req, res) => {
  try {
    const { email, source } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedEmail.length > 254 || !EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Validate and whitelist source
    const allowedSources = ["popup", "footer", "checkout"];
    const verifiedSource = allowedSources.includes(source) ? source : "popup";

    // Retrieve active popup configuration for discount code
    const settings = await NewsletterPopupSettings.getSettings();
    const hasCoupon = settings.offerCoupon !== false && Boolean(settings.discountCode);
    const discountCode = hasCoupon ? settings.discountCode : null;

    if (hasCoupon) {
      await ensureCouponExists(settings);
    }

    // Extract client IP safely
    const rawIp =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "";
    const clientIp = typeof rawIp === "string" ? rawIp.split(",")[0].trim() : "";

    // Check for existing subscriber
    let subscriber = await NewsletterSubscriber.findOne({ email: trimmedEmail });

    if (subscriber) {
      if (subscriber.status === "unsubscribed") {
        // Re-subscribe previous member
        subscriber.status = "subscribed";
        subscriber.subscribedAt = new Date();
        subscriber.unsubscribedAt = null;
        subscriber.source = verifiedSource;
        subscriber.discountCode = discountCode;
        subscriber.ipAddress = clientIp;
        await subscriber.save();

        return res.status(200).json({
          success: true,
          message: hasCoupon
            ? "Welcome back! Your subscription has been reactivated."
            : "Welcome back! You are now subscribed to our VIP circle.",
          discountCode,
          hasCoupon,
          alreadySubscribed: false,
        });
      }

      // Already active subscriber
      return res.status(200).json({
        success: true,
        message: hasCoupon
          ? "You are already part of our VIP circle! Here is your privilege code."
          : "You are already subscribed to our VIP circle.",
        discountCode,
        hasCoupon,
        alreadySubscribed: true,
      });
    }

    // Create new subscriber
    subscriber = await NewsletterSubscriber.create({
      email: trimmedEmail,
      status: "subscribed",
      source: verifiedSource,
      discountCode,
      ipAddress: clientIp,
      subscribedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: hasCoupon
        ? "Thank you for joining Maison MMMK WODE. Enjoy your welcome discount!"
        : "Thank you for joining Maison MMMK WODE VIP circle.",
      discountCode,
      hasCoupon,
      alreadySubscribed: false,
    });
  } catch (error) {
    console.error("[NewsletterController] subscribeNewsletter error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your subscription. Please try again.",
    });
  }
};

module.exports = {
  getPublicPopupConfig,
  checkSubscriberStatus,
  subscribeNewsletter,
};
