const mongoose = require("mongoose");
const NewsletterSubscriber = require("../../Models/NewsletterSubscriber");
const NewsletterPopupSettings = require("../../Models/NewsletterPopupSettings");

// Safe regex escape helper to prevent ReDoS
const escapeRegex = (string) =>
  string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GET /api/v1/admin/newsletter/subscribers
 * Paginated subscriber list with search and status filtering
 */
const getSubscribers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, status } = req.query;

    const filter = {};

    if (status && ["subscribed", "unsubscribed"].includes(status)) {
      filter.status = status;
    }

    if (search && typeof search === "string" && search.trim()) {
      filter.email = {
        $regex: escapeRegex(search.trim().toLowerCase()),
        $options: "i",
      };
    }

    const [subscribers, total, totalActive, totalUnsubscribed] = await Promise.all([
      NewsletterSubscriber.find(filter)
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsletterSubscriber.countDocuments(filter),
      NewsletterSubscriber.countDocuments({ status: "subscribed" }),
      NewsletterSubscriber.countDocuments({ status: "unsubscribed" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        subscribers,
        pagination: {
          total,
          totalActive,
          totalUnsubscribed,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("[NewsletterAdminController] getSubscribers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve newsletter subscribers.",
    });
  }
};

/**
 * GET /api/v1/admin/newsletter/subscribers/export
 * Exports all newsletter subscribers as RFC 4180 compliant CSV
 */
const exportSubscribersCsv = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ["subscribed", "unsubscribed"].includes(status)) {
      filter.status = status;
    }

    const subscribers = await NewsletterSubscriber.find(filter)
      .sort({ subscribedAt: -1 })
      .lean();

    const headers = [
      "Email",
      "Status",
      "Source",
      "Discount Code",
      "Subscribed At",
      "Unsubscribed At",
    ];

    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return '""';
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = subscribers.map((sub) => [
      escapeCsvValue(sub.email),
      escapeCsvValue(sub.status),
      escapeCsvValue(sub.source || "popup"),
      escapeCsvValue(sub.discountCode || "N/A"),
      escapeCsvValue(
        sub.subscribedAt ? new Date(sub.subscribedAt).toISOString() : ""
      ),
      escapeCsvValue(
        sub.unsubscribedAt ? new Date(sub.unsubscribedAt).toISOString() : ""
      ),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\r\n"
    );

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `mmmk_newsletter_subscribers_${timestamp}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("[NewsletterAdminController] exportSubscribersCsv error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export subscribers.",
    });
  }
};

/**
 * DELETE /api/v1/admin/newsletter/subscribers/:id
 * Permanently removes a subscriber
 */
const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscriber ID.",
      });
    }

    const deleted = await NewsletterSubscriber.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscriber removed successfully.",
    });
  } catch (error) {
    console.error("[NewsletterAdminController] deleteSubscriber error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete subscriber.",
    });
  }
};

/**
 * PATCH /api/v1/admin/newsletter/subscribers/:id/status
 * Updates status (subscribed/unsubscribed)
 */
const updateSubscriberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscriber ID.",
      });
    }

    if (!["subscribed", "unsubscribed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'subscribed' or 'unsubscribed'.",
      });
    }

    const updateData = { status };
    if (status === "unsubscribed") {
      updateData.unsubscribedAt = new Date();
    } else {
      updateData.subscribedAt = new Date();
      updateData.unsubscribedAt = null;
    }

    const subscriber = await NewsletterSubscriber.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Subscriber marked as ${status}.`,
      data: subscriber,
    });
  } catch (error) {
    console.error(
      "[NewsletterAdminController] updateSubscriberStatus error:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to update subscriber status.",
    });
  }
};

/**
 * GET /api/v1/admin/newsletter/popup-settings
 * Fetches full admin popup configuration
 */
const getPopupSettings = async (req, res) => {
  try {
    const settings = await NewsletterPopupSettings.getSettings();
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("[NewsletterAdminController] getPopupSettings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load popup settings.",
    });
  }
};

/**
 * PUT /api/v1/admin/newsletter/popup-settings
 * Updates popup configuration
 */
const updatePopupSettings = async (req, res) => {
  try {
    const {
      enabled,
      title,
      subtitle,
      discountCode,
      discountText,
      delaySeconds,
      displayFrequencyDays,
      backgroundImage,
    } = req.body;

    let settings = await NewsletterPopupSettings.findOne();
    if (!settings) {
      settings = new NewsletterPopupSettings();
    }

    if (enabled !== undefined) settings.enabled = Boolean(enabled);
    if (typeof title === "string" && title.trim())
      settings.title = title.trim();
    if (typeof subtitle === "string" && subtitle.trim())
      settings.subtitle = subtitle.trim();
    if (typeof discountCode === "string" && discountCode.trim())
      settings.discountCode = discountCode.trim().toUpperCase();
    if (typeof discountText === "string")
      settings.discountText = discountText.trim();
    if (Number.isFinite(Number(delaySeconds)))
      settings.delaySeconds = Math.max(1, Math.min(120, Number(delaySeconds)));
    if (Number.isFinite(Number(displayFrequencyDays)))
      settings.displayFrequencyDays = Math.max(
        1,
        Math.min(90, Number(displayFrequencyDays))
      );
    if (typeof backgroundImage === "string")
      settings.backgroundImage = backgroundImage.trim();

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Newsletter popup settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("[NewsletterAdminController] updatePopupSettings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update popup settings.",
    });
  }
};

module.exports = {
  getSubscribers,
  exportSubscribersCsv,
  deleteSubscriber,
  updateSubscriberStatus,
  getPopupSettings,
  updatePopupSettings,
};
