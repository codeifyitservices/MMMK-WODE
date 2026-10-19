const NewsletterSubscriber = require("../../Models/NewsletterSubscriber");
const NewsletterPopupSettings = require("../../Models/NewsletterPopupSettings");

// Basic email validation regex conforming to standard RFC specs
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * GET /api/v1/newsletter/popup-config
 * Returns active settings needed for the storefront popup
 */
const getPublicPopupConfig = async (req, res) => {
  try {
    const settings = await NewsletterPopupSettings.getSettings();

    return res.status(200).json({
      success: true,
      data: {
        enabled: Boolean(settings.enabled),
        title: settings.title || "JOIN THE MAISON MMMK WODE",
        subtitle:
          settings.subtitle ||
          "Enjoy 15% off your first purchase and receive private invitations to exclusive releases.",
        discountCode: settings.discountCode || "WELCOME15",
        discountText: settings.discountText || "Use code at checkout for 15% off",
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
    const discountCode = settings.discountCode || "WELCOME15";

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
          message: "Welcome back! Your subscription has been reactivated.",
          discountCode,
          alreadySubscribed: false,
        });
      }

      // Already active subscriber
      return res.status(200).json({
        success: true,
        message: "You are already part of our VIP circle! Here is your privilege code.",
        discountCode,
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
      message: "Thank you for joining Maison MMMK WODE. Enjoy your welcome discount!",
      discountCode,
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
  subscribeNewsletter,
};
