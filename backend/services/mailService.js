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

/**
 * Send welcome & credentials email to an approved influencer.
 */
async function sendInfluencerWelcomeEmail({
  email,
  fullName,
  username,
  rawPassword,
  referralCode,
  commissionRate = 10,
  discountRate = 20,
  portalUrl,
  referralLink,
}) {
  try {
    const subject = "Welcome to MMMK WODE Influencer Community — Your Login Credentials";
    const appPortalUrl = portalUrl || `${process.env.FRONTEND_URL || "https://mmmk-wode.com"}/influencer/login`;
    const shareableLink = referralLink || `${process.env.FRONTEND_URL || "https://mmmk-wode.com"}?ref=${referralCode}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0b0b0b; color: #f5f5f5; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #141414; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; }
          .header { background-color: #000000; padding: 32px 24px; text-align: center; border-bottom: 2px solid #dfba73; }
          .logo { max-width: 130px; }
          .content { padding: 32px 28px; line-height: 1.6; }
          .badge { display: inline-block; background-color: rgba(223, 186, 115, 0.15); color: #dfba73; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
          h1 { color: #ffffff; font-size: 22px; margin: 0 0 16px; font-weight: 600; }
          p { color: #b5b5b5; font-size: 14px; margin: 0 0 16px; }
          .credentials-box { background-color: #1a1a1a; border-left: 4px solid #dfba73; padding: 18px; margin: 24px 0; border-radius: 4px; }
          .credential-item { margin: 8px 0; font-size: 14px; color: #e5e5e5; }
          .credential-item strong { color: #dfba73; display: inline-block; width: 140px; }
          .button { display: inline-block; background-color: #dfba73; color: #000000; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: bold; border-radius: 4px; margin-top: 16px; }
          .footer { background-color: #0d0d0d; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #222222; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="color: #dfba73; margin: 0; letter-spacing: 2px;">MMMK WODE</h2>
            <p style="color: #888888; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">Luxury Affiliate Community</p>
          </div>
          <div class="content">
            <div class="badge">Application Approved</div>
            <h1>Congratulations, ${fullName || "Partner"}!</h1>
            <p>Your application to join the <strong>MMMK WODE Influencer Community</strong> has been approved. You are now officially partnered with us.</p>
            
            <p>Here are your secure credentials to access your dedicated Influencer Dashboard:</p>
            
            <div class="credentials-box">
              <div class="credential-item"><strong>Username:</strong> ${username}</div>
              <div class="credential-item"><strong>Temporary Password:</strong> <code style="background:#262626; padding: 2px 6px; border-radius:3px; color:#ffffff;">${rawPassword}</code></div>
              <div class="credential-item"><strong>Your Unique Code:</strong> <span style="font-weight:bold; color:#dfba73;">${referralCode}</span></div>
              <div class="credential-item"><strong>Community Discount:</strong> ${discountRate}% OFF for your buyers</div>
              <div class="credential-item"><strong>Your Commission:</strong> ${commissionRate}% per completed order</div>
            </div>

            <p><strong>Your Storefront Referral Link:</strong><br/>
              <a href="${shareableLink}" style="color: #dfba73; word-break: break-all;">${shareableLink}</a>
            </p>

            <p>Every customer who visits using your link will automatically receive <strong>${discountRate}% OFF</strong> their entire order at checkout, and you will earn <strong>${commissionRate}% commission</strong> on every verified purchase!</p>

            <center>
              <a href="${appPortalUrl}" class="button">Log In to Influencer Dashboard</a>
            </center>
            
            <p style="font-size: 12px; color: #777777; margin-top: 24px;">* For security, please change your password immediately after your first login in your profile settings.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} MMMK WODE. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Congratulations ${fullName || "Partner"}! Your MMMK WODE Influencer application is approved. Username: ${username}, Password: ${rawPassword}, Referral Code: ${referralCode}. Log in at: ${appPortalUrl}`;

    await sendMail(email, subject, text, html);
    console.log(`[MailService] Influencer credentials sent to ${email}`);
  } catch (err) {
    console.error("[MailService] Failed to send influencer welcome email:", err?.message || err);
  }
}

/**
 * Send payout status update email to influencer.
 */
async function sendInfluencerPayoutStatusEmail(influencer, payoutRequest) {
  try {
    const isPaid = payoutRequest.status === "Paid";
    const subject = isPaid
      ? "Payout Processed — MMMK WODE Influencer Community"
      : `Payout Request Update: ${payoutRequest.status}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background-color: #0b0b0b; color: #f5f5f5; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #141414; border: 1px solid #2a2a2a; border-radius: 8px; padding: 28px;">
          <h2 style="color: #dfba73; margin-top: 0;">MMMK WODE Influencer Community</h2>
          <h3>Hello, ${influencer?.fullName || "Partner"}</h3>
          <p>Your payout request for <strong>AED ${payoutRequest?.requestedAmount}</strong> is now marked as <strong>${payoutRequest?.status}</strong>.</p>
          ${
            payoutRequest?.transactionReference
              ? `<p><strong>Transaction / UTR Reference:</strong> ${payoutRequest.transactionReference}</p>`
              : ""
          }
          ${
            payoutRequest?.adminNote
              ? `<p><strong>Admin Note:</strong> ${payoutRequest.adminNote}</p>`
              : ""
          }
          <p>You can review your updated balance and ledger in your <a href="${process.env.FRONTEND_URL || "https://mmmk-wode.com"}/influencer/login" style="color: #dfba73;">Influencer Dashboard</a>.</p>
        </div>
      </body>
      </html>
    `;

    await sendMail(
      influencer.email,
      subject,
      `Payout update for AED ${payoutRequest.requestedAmount}: ${payoutRequest.status}`,
      html
    );
  } catch (err) {
    console.error("[MailService] Failed to send payout status email:", err?.message || err);
  }
}

module.exports = {
  sendMail,
  sendOrderConfirmationEmail,
  sendInfluencerWelcomeEmail,
  sendInfluencerPayoutStatusEmail,
};


