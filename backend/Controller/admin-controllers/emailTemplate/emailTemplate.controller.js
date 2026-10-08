const EmailTemplate = require("../../../Models/EmailTemplate");
const { sendMail, sendOrderConfirmationEmail } = require("../../../services/mailService");
const { buildOrderConfirmationHtml } = require("../../../utils/emailTemplates/orderConfirmation");
const Order = require("../../../Models/Order");
const User = require("../../../Models/User");

const TEMPLATE_TYPE = "order_confirmation";

const DEFAULT_TEMPLATE = {
  type: TEMPLATE_TYPE,
  subject: "Your MMMK Wode Order Has Been Confirmed! 🎉",
  customMessage:
    "Thank you for your order! We are thrilled to have you as part of the MMMK Wode family. Your order is now being processed and we will notify you once it ships.",
};

/**
 * GET /api/v1/admin/emailTemplate/get
 * Returns the current order_confirmation template settings.
 * Creates a default one if none exists yet.
 */
const getEmailTemplate = async (req, res) => {
  try {
    let template = await EmailTemplate.findOne({ type: TEMPLATE_TYPE });
    if (!template) {
      template = await EmailTemplate.create(DEFAULT_TEMPLATE);
    }
    return res.status(200).json({
      success: true,
      message: "Email template fetched successfully",
      data: template,
    });
  } catch (err) {
    console.error("[EmailTemplate] getEmailTemplate error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch email template",
    });
  }
};

/**
 * POST /api/v1/admin/emailTemplate/update
 * Body: { subject?, customMessage? }
 * Updates the order_confirmation template settings.
 */
const updateEmailTemplate = async (req, res) => {
  try {
    const { subject, customMessage } = req.body || {};

    if (subject === undefined && customMessage === undefined) {
      return res.status(400).json({
        success: false,
        message: "At least one field (subject or customMessage) is required",
      });
    }

    const updatePayload = {};
    if (subject !== undefined) updatePayload.subject = String(subject).trim();
    if (customMessage !== undefined) updatePayload.customMessage = String(customMessage).trim();

    const template = await EmailTemplate.findOneAndUpdate(
      { type: TEMPLATE_TYPE },
      { $set: updatePayload },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Email template updated successfully",
      data: template,
    });
  } catch (err) {
    console.error("[EmailTemplate] updateEmailTemplate error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update email template",
    });
  }
};

/**
 * POST /api/v1/admin/emailTemplate/send-test
 * Body: { email? } — if omitted, sends to the logged-in admin's email.
 * Sends a test order confirmation email with a dummy order payload.
 */
const sendTestEmail = async (req, res) => {
  try {
    const targetEmail = req.body?.email || req.admin?.email;

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: "A recipient email address is required",
      });
    }

    let template = await EmailTemplate.findOne({ type: TEMPLATE_TYPE });
    if (!template) {
      template = await EmailTemplate.create(DEFAULT_TEMPLATE);
    }

    const BACKEND_URL  = process.env.BACKEND_URL  || "";
    const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.mmmkwode.com";
    const logoUrl =
      process.env.LOGO_URL ||
      (BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, "")}/uploads/brand-logo.png` : null) ||
      `${FRONTEND_URL.replace(/\/$/, "")}/Wode%20Logo.png`;


    // Build a realistic-looking dummy order for the preview
    const mockOrder = {
      orderId: "TEST-ORDER-2025",
      createdAt: new Date(),
      currency: "AED",
      paymentMethod: "COD",
      paymentStatus: "Pending",
      price: {
        subtotal: 450,
        shippingCharges: 30,
        discount: 0,
        couponDiscount: 0,
        creditApplied: 0,
        total: 480,
      },
      shippingAddress: {
        first_name: "Jane",
        last_name: "Doe",
        address: "123 Luxury Lane",
        city: "Dubai",
        state: "Dubai",
        country: "United Arab Emirates",
        postcode: "00000",
        email: targetEmail,
      },
      products: [
        {
          id: {
            productName: { en: "Signature Silk Blouse" },
            images: [],
          },
          sku: "SILK-BLO-001",
          quantity: 1,
          amount: 250,
        },
        {
          id: {
            productName: { en: "Cashmere Wide-Leg Trousers" },
            images: [],
          },
          sku: "CSHM-TRS-002",
          quantity: 1,
          amount: 200,
        },
      ],
    };

    const mockUser = {
      firstName: "Jane",
      lastName: "Doe",
      email: targetEmail,
    };

    const html = buildOrderConfirmationHtml({
      order: mockOrder,
      user: mockUser,
      customMessage: template.customMessage,
      logoUrl,
    });

    const subject = `[TEST] ${template.subject}`;
    const text = `This is a test email preview for the order confirmation template.`;

    await sendMail(targetEmail, subject, text, html);

    return res.status(200).json({
      success: true,
      message: `Test email sent to ${targetEmail}`,
    });
  } catch (err) {
    console.error("[EmailTemplate] sendTestEmail error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to send test email",
    });
  }
};

module.exports = { getEmailTemplate, updateEmailTemplate, sendTestEmail };
