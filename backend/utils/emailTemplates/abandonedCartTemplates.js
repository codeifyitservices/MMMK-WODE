/**
 * Abandoned Cart Email Templates
 * Generates fully inline-styled HTML emails matching MMMK Wode luxury brand aesthetic.
 *
 * Brand Palette:
 *   - Primary dark brown:  #28120b
 *   - Light brown/rose:    #8b5e4b
 *   - Olive accent:        #635d4a
 *   - Beige border/accent: #ded7d1
 *   - Background cream:    #f9f5f2
 *   - Page background:     #f4f0ec
 *
 * Typography: Georgia, serif / Arial, sans-serif fallback
 */

const formatPrice = (val, currency = "AED") =>
  typeof val === "number"
    ? `${currency} ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${currency} 0.00`;

/**
 * Builds the shared luxury email wrapper & product list table
 */
function buildBaseCartEmail({
  title,
  subtitle,
  badgeText,
  customerName,
  customMessage,
  cartItems = [],
  cartTotal = 0,
  currency = "AED",
  ctaUrl,
  ctaText,
  specialOfferBox = null,
  logoUrl,
}) {
  const name = customerName || "Valued Customer";

  const logoSection = logoUrl
    ? `<img src="${logoUrl}" alt="MMMK Wode" height="60" style="height:60px;max-width:220px;display:block;margin:0 auto;" />`
    : `<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#ded7d1;letter-spacing:4px;margin:0;">MMMK WODE</h1>`;

  const productsHtml = (cartItems || [])
    .map((item) => {
      const productName = item?.name || item?.product?.productName?.en || item?.product?.productName || "Luxury Item";
      const sku = item?.sku || "";
      const qty = item?.quantity || 1;
      const unitPrice = item?.price ?? item?.amount ?? 0;
      const itemTotal = formatPrice(unitPrice * qty, currency);
      const imgUrl = item?.image || item?.product?.images?.[0]?.url || item?.product?.images?.[0] || null;

      const imgCell = imgUrl
        ? `<img src="${imgUrl}" alt="${productName}" width="80" height="80"
             style="width:80px;height:80px;object-fit:cover;border-radius:4px;display:block;border:1px solid #ded7d1;" />`
        : `<div style="width:80px;height:80px;background:#ded7d1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#635d4a;text-align:center;line-height:1.2;">No<br/>Image</div>`;

      return `
      <tr>
        <td style="padding:14px 10px;border-bottom:1px solid #ece8e4;vertical-align:top;width:100px;">
          ${imgCell}
        </td>
        <td style="padding:14px 10px;border-bottom:1px solid #ece8e4;vertical-align:top;">
          <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#28120b;font-weight:600;">${productName}</p>
          ${sku ? `<p style="margin:0 0 4px;font-size:12px;color:#8b5e4b;font-family:Arial,sans-serif;">SKU: ${sku}</p>` : ""}
          <p style="margin:0;font-size:13px;color:#635d4a;font-family:Arial,sans-serif;">Qty: ${qty}</p>
        </td>
        <td style="padding:14px 10px;border-bottom:1px solid #ece8e4;vertical-align:top;text-align:right;white-space:nowrap;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#28120b;font-family:Arial,sans-serif;">${itemTotal}</p>
        </td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} – MMMK Wode</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f0ec;font-family:Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f0ec;min-height:100vh;">
    <tr>
      <td align="center" style="padding:30px 16px;">

        <!-- Email card -->
        <table width="620" cellpadding="0" cellspacing="0" border="0"
          style="max-width:620px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(40,18,11,0.10);">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background-color:#28120b;padding:32px 40px;text-align:center;">
              ${logoSection}
              <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;color:#8b5e4b;text-transform:uppercase;">Luxury Fashion & Lifestyle</p>
            </td>
          </tr>

          <!-- ── SUBHEADER / STAGE BANNER ── -->
          <tr>
            <td style="background-color:#3d1e10;padding:22px 40px;text-align:center;">
              ${
                badgeText
                  ? `<span style="display:inline-block;background-color:#635d4a;color:#ded7d1;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;padding:4px 12px;border-radius:2px;text-transform:uppercase;margin-bottom:8px;">${badgeText}</span>`
                  : ""
              }
              <h2 style="margin:4px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#f9f5f2;letter-spacing:1px;">
                ${subtitle}
              </h2>
            </td>
          </tr>

          <!-- ── BODY CONTENT ── -->
          <tr>
            <td style="padding:36px 40px 0;">

              <!-- Greeting -->
              <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#28120b;">
                Dear ${name},
              </p>

              <!-- Custom message / Stage description -->
              <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#635d4a;margin:0 0 28px;">
                ${customMessage}
              </div>

              <!-- Special Offer Box (Stage 3 Coupon) -->
              ${specialOfferBox || ""}

              <!-- Divider -->
              <div style="border-top:1px solid #ede8e4;margin-bottom:24px;"></div>

              <!-- Cart items heading -->
              <h3 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-weight:400;color:#8b5e4b;letter-spacing:3px;text-transform:uppercase;">Items in Your Cart</h3>

              <!-- Products table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #ece8e4;margin-bottom:24px;">
                ${productsHtml || `<tr><td colspan="3" style="padding:20px;text-align:center;color:#8b5e4b;font-family:Arial,sans-serif;font-size:13px;">No items found</td></tr>`}
              </table>

              <!-- Cart Subtotal row -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;background:#f9f5f2;border-radius:4px;padding:16px;">
                <tr>
                  <td style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#28120b;font-weight:600;padding:4px 12px;">
                    Estimated Total
                  </td>
                  <td style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#28120b;font-weight:700;text-align:right;padding:4px 12px;">
                    ${formatPrice(cartTotal, currency)}
                  </td>
                </tr>
              </table>

              <!-- Primary Call To Action Button -->
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 36px;">
                <tr>
                  <td align="center" style="background-color:#28120b;border-radius:2px;padding:14px 36px;">
                    <a href="${ctaUrl}" target="_blank"
                       style="font-family:Arial,sans-serif;font-size:13px;letter-spacing:2px;color:#ded7d1;text-decoration:none;font-weight:600;text-transform:uppercase;display:inline-block;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background-color:#28120b;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:400;color:#ded7d1;letter-spacing:1px;">
                MMMK Wode – Timeless Elegance
              </p>
              <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:12px;color:#8b5e4b;line-height:1.6;">
                Need assistance? Reply directly to this email or visit our customer support.
              </p>
              <div style="border-top:1px solid #3d1e10;padding-top:18px;">
                <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#635d4a;letter-spacing:1px;">
                  © ${new Date().getFullYear()} MMMK Wode · All rights reserved
                </p>
              </div>
            </td>
          </tr>

        </table>
        <!-- /email card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Stage 1: 6 Hours Reminder Email
 */
function buildStage6hEmail({ user, cartItems, cartTotal, currency, cartUrl, logoUrl, customMessage }) {
  const customerName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Valued Customer";
  const defaultMsg =
    customMessage ||
    "We noticed you left some exceptional pieces in your shopping cart. These items have been saved for you so you can pick up right where you left off.";

  const html = buildBaseCartEmail({
    title: "You left something behind",
    subtitle: "You Left Something Behind",
    badgeText: "Cart Reminder",
    customerName,
    customMessage: defaultMsg,
    cartItems,
    cartTotal,
    currency,
    ctaUrl: cartUrl,
    ctaText: "Return to My Cart",
    logoUrl,
  });

  const text = `Hi ${customerName},\n\nYou left items in your MMMK Wode shopping cart. Your saved total is ${formatPrice(cartTotal, currency)}.\n\nReturn to your cart here: ${cartUrl}\n\nMMMK Wode`;

  return { html, text, subject: "You left something behind – MMMK Wode" };
}

/**
 * Stage 2: 12 Hours Reminder Email
 */
function buildStage12hEmail({ user, cartItems, cartTotal, currency, cartUrl, logoUrl, customMessage }) {
  const customerName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Valued Customer";
  const defaultMsg =
    customMessage ||
    "Your curated selection is still waiting in your cart. Due to high demand and limited availability across our collections, we recommend securing your items before they sell out.";

  const html = buildBaseCartEmail({
    title: "Your cart is still waiting",
    subtitle: "Your Cart is Still Waiting",
    badgeText: "Still Available",
    customerName,
    customMessage: defaultMsg,
    cartItems,
    cartTotal,
    currency,
    ctaUrl: cartUrl,
    ctaText: "View My Cart",
    logoUrl,
  });

  const text = `Hi ${customerName},\n\nYour cart items are still waiting at MMMK Wode. Total: ${formatPrice(cartTotal, currency)}.\n\nView your cart here: ${cartUrl}\n\nMMMK Wode`;

  return { html, text, subject: "Your cart is still waiting – MMMK Wode" };
}

/**
 * Stage 3: 24 Hours Coupon Offer Email (with secure claim link)
 */
function buildStage24hCouponEmail({
  user,
  cartItems,
  cartTotal,
  currency,
  claimUrl,
  discountPercent = 10,
  expiryDays = 3,
  logoUrl,
  customMessage,
}) {
  const customerName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Valued Customer";
  const defaultMsg =
    customMessage ||
    `To help you complete your order, we have prepared an exclusive **${discountPercent}% discount** for your cart. Simply click the secure button below to claim and apply this special offer to your order.`;

  const specialOfferBox = `
    <div style="background:#28120b;border:1px solid #8b5e4b;border-radius:4px;padding:24px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;color:#8b5e4b;text-transform:uppercase;">Exclusive Offer</p>
      <h3 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#ded7d1;font-weight:400;letter-spacing:1px;">
        Enjoy ${discountPercent}% Off Your Order
      </h3>
      <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:12px;color:#ded7d1;line-height:1.5;">
        This special recovery offer is reserved exclusively for you and expires in ${expiryDays} days.<br/>
        Click below to claim your offer securely and apply it to your cart.
      </p>
    </div>
  `;

  const html = buildBaseCartEmail({
    title: "A special offer for your cart",
    subtitle: "A Special Gift For Your Cart",
    badgeText: `${discountPercent}% Off Offer`,
    customerName,
    customMessage: defaultMsg,
    cartItems,
    cartTotal,
    currency,
    ctaUrl: claimUrl,
    ctaText: `Claim My ${discountPercent}% Off`,
    specialOfferBox,
    logoUrl,
  });

  const text = `Hi ${customerName},\n\nWe've created an exclusive ${discountPercent}% off offer for your cart at MMMK Wode.\n\nClick here to claim your offer securely: ${claimUrl}\n\nThis offer is valid for ${expiryDays} days.\n\nMMMK Wode`;

  return {
    html,
    text,
    subject: `A special ${discountPercent}% offer for your cart – MMMK Wode`,
  };
}

/**
 * Stage 4: 48 Hours Final Reminder Email
 */
function buildStage48hFinalEmail({ user, cartItems, cartTotal, currency, cartUrl, logoUrl, customMessage }) {
  const customerName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Valued Customer";
  const defaultMsg =
    customMessage ||
    "This is our final reminder regarding the items in your cart. We will soon release these items back to our general inventory for other customers.";

  const html = buildBaseCartEmail({
    title: "Final reminder: Your cart",
    subtitle: "Final Reminder for Your Cart",
    badgeText: "Final Notice",
    customerName,
    customMessage: defaultMsg,
    cartItems,
    cartTotal,
    currency,
    ctaUrl: cartUrl,
    ctaText: "Complete Your Order",
    logoUrl,
  });

  const text = `Hi ${customerName},\n\nThis is a final reminder regarding the items in your cart at MMMK Wode. Saved total: ${formatPrice(cartTotal, currency)}.\n\nComplete your order here: ${cartUrl}\n\nMMMK Wode`;

  return { html, text, subject: "Final reminder: Your cart at MMMK Wode" };
}

module.exports = {
  buildStage6hEmail,
  buildStage12hEmail,
  buildStage24hCouponEmail,
  buildStage48hFinalEmail,
};
