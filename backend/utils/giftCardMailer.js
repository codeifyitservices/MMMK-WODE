const { sendMail } = require("../services/mailService");
const { resolveCurrencyCode, convertToCurrency } = require("./currency");

/**
 * Sends a themed email to the gift card recipient.
 */
const queueGiftCardShareEmail = async ({ giftCard, recipient, sharedBy }) => {
  try {
    const senderName = `${sharedBy?.firstName || ""} ${sharedBy?.lastName || ""}`.trim() || "A friend";
    const amount = giftCard.amountInCurrency || giftCard.amount;
    const currency = giftCard.currency || "USD";
    
    // Formatting currency for display (e.g., ₹1,000.00)
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);

    const subject = `${senderName} sent you a gift card for MMMK Wode!`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; color: #333;">
        <!-- Header / Logo -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <img src="https://mmmk-wode.com/Wode%20Logo.png" alt="MMMK Wode Logo" style="width: 120px; height: auto;" />
        </div>

        <!-- Hero Section -->
        <div style="padding: 40px 30px; text-align: center;">
          <h1 style="font-size: 24px; color: #05682F; margin-bottom: 10px;">
            ${senderName} has sent you a gift card worth ${formattedAmount} for MMMK Wode
          </h1>
          <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
            Congratulations! You've received a special gift to shop for your favorite premium collection.
          </p>

          <!-- Gift Card Details Box -->
          <div style="background-color: #f0fdf4; border: 2px dashed #05682F; border-radius: 10px; padding: 25px; margin-bottom: 30px; display: inline-block; width: 100%; box-sizing: border-box;">
            <div style="margin-bottom: 15px;">
              <span style="font-size: 14px; text-transform: uppercase; color: #666; letter-spacing: 1px;">Gift Card Code</span>
              <div style="font-size: 22px; font-weight: bold; color: #333; margin-top: 5px; font-family: 'Courier New', Courier, monospace;">
                ${giftCard.code}
              </div>
            </div>
            <div>
              <span style="font-size: 14px; text-transform: uppercase; color: #666; letter-spacing: 1px;">Password</span>
              <div style="font-size: 22px; font-weight: bold; color: #333; margin-top: 5px; font-family: 'Courier New', Courier, monospace;">
                ${giftCard.password}
              </div>
            </div>
          </div>

          <!-- CTA Button -->
          <div>
            <a href="https://mmmk-wode.com/profile/my-credit" 
               style="background-color: #05682F; color: white; padding: 16px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px; transition: background-color 0.3s;">
              Redeem Your Gift Card
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0;">
          <p>MMMK Wode - Premium Swimwear & More</p>
          <p>Visit us at <a href="https://mmmk-wode.com" style="color: #05682F;">mmmk-wode.com</a></p>
          <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} MMMK Wode. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendMail(recipient.recipientEmail, subject, "", htmlContent);
    return { success: true };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Unknown error";
    return { success: false, error: errorMessage };
  }
};

module.exports = {
  queueGiftCardShareEmail,
};
