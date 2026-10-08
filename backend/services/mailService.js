const axios = require("axios");
const EmailTemplate = require("../Models/EmailTemplate");
const { buildOrderConfirmationHtml } = require("../utils/emailTemplates/orderConfirmation");

/**
 * Mail Service using Brevo (formerly Sendinblue) API
 */
async function sendMail(to, subject, text, html) {
  try {
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const SENDER_EMAIL = process.env.EMAIL || "codeifyitservices@gmail.com";
    const SENDER_NAME = "MMMK Wode";

    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is missing in environment variables");
    }

    const data = {
      sender: {
        name: SENDER_NAME,
        email: SENDER_EMAIL,
      },
      to: Array.isArray(to) 
        ? to.map(email => ({ email })) 
        : [{ email: to }],
      subject: subject,
      htmlContent: html,
      textContent: text || subject || "Message from MMMK Wode", // Fallback to subject or generic text
    };

    const response = await axios.post("https://api.brevo.com/v3/smtp/email", data, {
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Send a branded order confirmation email to the customer.
 * Pulls the admin-customised message from the EmailTemplate collection.
 *
 * @param {object} order - Populated Mongoose Order document
 * @param {object} user  - User document { firstName, lastName, email }
 */
async function sendOrderConfirmationEmail(orderInput, userInput) {
  try {
    if (!orderInput) return;

    let order = orderInput;
    let user = userInput;

    const Order = require("../Models/Order");
    const User = require("../Models/User");

    // Check if already sent on the provided order object
    if (order.confirmationEmailSent) {
      console.log(`[MailService] Confirmation email already sent for order ${order.orderId}, skipping.`);
      return;
    }

    // Refresh from DB and populate products if order._id is available
    if (order._id) {
      try {
        const freshOrder = await Order.findById(order._id)
          .populate({
            path: "products.id",
            select: "productName image thumbnail images sku price category",
          })
          .lean();

        if (freshOrder) {
          if (freshOrder.confirmationEmailSent) {
            console.log(`[MailService] Confirmation email already sent for order ${freshOrder.orderId}, skipping.`);
            return;
          }
          order = freshOrder;
        }
      } catch (popErr) {
        console.warn("[MailService] Failed to populate order for confirmation email:", popErr?.message);
      }
    }

    // Resolve user if not provided
    if (!user && order.userId) {
      try {
        user = await User.findById(order.userId).lean();
      } catch (uErr) {
        console.warn("[MailService] Could not fetch user by userId:", uErr?.message);
      }
    }

    const recipientEmail =
      user?.email ||
      order?.shippingAddress?.email ||
      order?.billingAddress?.email ||
      order?.temp?.guestEmail ||
      order?.temp?.email ||
      order?.temp?.customerEmail ||
      order?.userEmail;

    if (!recipientEmail) {
      console.warn(`[MailService] sendOrderConfirmationEmail: no recipient email found for order ${order?.orderId}, skipping.`);
      return;
    }

    // Fetch admin-editable template settings (upsert a default if not yet created)
    let template = await EmailTemplate.findOne({ type: "order_confirmation" });
    if (!template) {
      template = await EmailTemplate.create({
        type: "order_confirmation",
        subject: "Your MMMK Wode Order Has Been Confirmed! 🎉",
        customMessage:
          "Thank you for your order! We are thrilled to have you as part of the MMMK Wode family. Your order is now being processed and we will notify you once it ships.",
      });
    }

    // Absolute URL to the brand logo.
    const BACKEND_URL  = process.env.BACKEND_URL  || "";
    const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.mmmkwode.com";
    const logoUrl =
      process.env.LOGO_URL ||
      (BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, "")}/uploads/brand-logo.png` : null) ||
      `${FRONTEND_URL.replace(/\/$/, "")}/Wode%20Logo.png`;

    const html = buildOrderConfirmationHtml({
      order,
      user,
      customMessage: template.customMessage,
      logoUrl,
    });

    const subject = template.subject || "Your MMMK Wode Order Has Been Confirmed! 🎉";
    const customerGreeting =
      user?.firstName ||
      order?.shippingAddress?.firstName ||
      order?.shippingAddress?.first_name ||
      "Valued Customer";
    const text = `Hi ${customerGreeting}, your order #${order?.orderId} has been confirmed. Total: ${order?.currency || "AED"} ${order?.price?.total ?? order?.amount ?? "—"}.`;

    await sendMail(recipientEmail, subject, text, html);
    console.log(`[MailService] Order confirmation email sent to ${recipientEmail} for order ${order?.orderId}`);

    // Mark as sent in DB to prevent duplicate emails across webhooks/refresh calls
    if (order._id) {
      try {
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            confirmationEmailSent: true,
            confirmationEmailSentAt: new Date(),
          },
        });
      } catch (saveErr) {
        console.warn("[MailService] Failed to record confirmationEmailSent flag:", saveErr?.message);
      }
    }

    // Stop and complete any active abandoned cart recovery sequence
    if (order?.userId) {
      const { onOrderCompleted } = require("./abandonedCartService");
      onOrderCompleted(order.userId, order).catch(() => {});
    }
  } catch (err) {
    // Non-blocking: log but do not re-throw so order creation is not affected
    console.error("[MailService] Failed to send order confirmation email:", err?.message || err);
  }
}

module.exports = { sendMail, sendOrderConfirmationEmail };

