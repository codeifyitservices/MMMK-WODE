/**
 * Order Confirmation Email Template
 * Generates fully inline-styled HTML email matching the MMMK Wode brand aesthetic.
 *
 * Colors:
 *   - Primary dark brown:  #28120b
 *   - Light brown/rose:    #8b5e4b
 *   - Olive:               #635d4a
 *   - Beige:               #ded7d1
 *   - Cream:               #f9f5f2
 *   - Sage accent:         #e6ffcc
 *
 * Font: Belleza (web-safe fallback: Georgia)
 */

function resolveImageUrl(img) {
  if (!img) return null;
  if (/^https?:\/\//i.test(img)) return img;
  const baseUrl =
    process.env.PUBLIC_UPLOAD_BASE_URL ||
    (process.env.BACKEND_URL ? `${process.env.BACKEND_URL.replace(/\/$/, "")}/uploads` : null) ||
    "https://node.projects.codenap.in/mmk/uploads";
  return `${baseUrl.replace(/\/$/, "")}/${img.replace(/^\/+/, "")}`;
}

/**
 * @param {object} params
 * @param {object} params.order         - The populated Mongoose order document
 * @param {object} params.user          - The User document { firstName, lastName, email }
 * @param {string} params.customMessage - Admin-editable message (plain text or simple HTML)
 * @param {string} params.logoUrl       - Absolute public URL to the brand logo
 * @returns {string} Complete HTML string safe to send via email client
 */
function buildOrderConfirmationHtml({ order, user, customMessage, logoUrl }) {
  const customerName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    [order?.shippingAddress?.firstName, order?.shippingAddress?.lastName].filter(Boolean).join(" ") ||
    [order?.shippingAddress?.first_name, order?.shippingAddress?.last_name].filter(Boolean).join(" ") ||
    order?.shippingAddress?.name ||
    order?.shippingAddress?.recipient_name ||
    "Valued Customer";

  const orderId = order?.orderId || "—";
  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const currency = order?.currency || "AED";

  // Format price helper
  const fmt = (val) =>
    typeof val === "number"
      ? `${currency} ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "—";

  const price = order?.price || {};
  const subtotal = fmt(price.subtotal);
  const shipping = fmt(price.shippingCharges);
  const discount =
    (price.discount || 0) > 0 ? `-${fmt(price.discount)}` : "—";
  const couponDiscount =
    (price.couponDiscount || 0) > 0 ? `-${fmt(price.couponDiscount)}` : "—";
  const creditApplied =
    (price.creditApplied || 0) > 0 ? `-${fmt(price.creditApplied)}` : "—";
  const total = fmt(price.total);

  // Shipping address (supports camelCase and snake_case properties)
  const addr = order?.shippingAddress || {};
  const addrName =
    [addr.firstName, addr.lastName].filter(Boolean).join(" ") ||
    [addr.first_name, addr.last_name].filter(Boolean).join(" ") ||
    addr.name ||
    "";

  const street =
    addr.streetAddress ||
    addr.street_address ||
    addr.address ||
    [addr.addressLine1, addr.addressLine2].filter(Boolean).join(", ") ||
    "";

  const cityState = [addr.city, addr.state].filter(Boolean).join(", ");
  const country = addr.country || "";
  const postal =
    addr.postalCode ||
    addr.postal_code ||
    addr.postcode ||
    addr.zipCode ||
    "";
  const phone =
    addr.phoneNumber ||
    addr.phone_number ||
    addr.phone ||
    "";

  const addrLine = [
    addrName,
    street,
    addr.landmark ? `Landmark: ${addr.landmark}` : null,
    cityState,
    country,
    postal,
    phone ? `Tel: ${phone}` : null,
  ]
    .filter(Boolean)
    .join("<br/>");

  // Products rows
  const productsHtml = (order?.products || [])
    .map((item) => {
      const product = item?.id || {};
      const name =
        product?.productName?.en ||
        (typeof product?.productName === "string" ? product?.productName : null) ||
        item?.name ||
        "Product";

      const sku = item?.sku || "";
      const qty = item?.quantity || 1;
      const itemTotal = fmt(item?.amount || 0);

      // Grab first image URL if available
      const images = product?.images || [];
      const rawImgUrl =
        product?.image ||
        product?.thumbnail ||
        images[0]?.url ||
        images[0] ||
        item?.image ||
        null;
      const imgUrl = resolveImageUrl(rawImgUrl);

      const imgCell = imgUrl
        ? `<img src="${imgUrl}" alt="${name}" width="80" height="80"
             style="width:80px;height:80px;object-fit:cover;border-radius:4px;display:block;border:1px solid #ded7d1;" />`
        : `<div style="width:80px;height:80px;background:#ded7d1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#635d4a;text-align:center;line-height:1.2;">No<br/>Image</div>`;

      return `
      <tr>
        <td style="padding:14px 10px;border-bottom:1px solid #ece8e4;vertical-align:top;width:100px;">
          ${imgCell}
        </td>
        <td style="padding:14px 10px;border-bottom:1px solid #ece8e4;vertical-align:top;">
          <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#28120b;font-weight:600;">${name}</p>
          ${sku ? `<p style="margin:0 0 4px;font-size:12px;color:#8b5e4b;font-family:Arial,sans-serif;">SKU: ${sku}</p>` : ""}
          <p style="margin:0;font-size:13px;color:#635d4a;font-family:Arial,sans-serif;">Qty: ${qty}</p>
        </td>
        <td style="padding:14px 10px;border-bottom:1px solid #ece8e4;vertical-align:top;text-align:right;white-space:nowrap;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#28120b;font-family:Arial,sans-serif;">${itemTotal}</p>
        </td>
      </tr>`;
    })
    .join("");

  // Summary rows helper
  const summaryRow = (label, value, isTotal = false) =>
    isTotal
      ? `<tr>
          <td style="padding:10px 0 4px;border-top:1px solid #28120b;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:700;color:#28120b;">${label}</td>
          <td style="padding:10px 0 4px;border-top:1px solid #28120b;text-align:right;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:700;color:#28120b;">${value}</td>
        </tr>`
      : `<tr>
          <td style="padding:5px 0;font-family:Arial,sans-serif;font-size:13px;color:#635d4a;">${label}</td>
          <td style="padding:5px 0;text-align:right;font-family:Arial,sans-serif;font-size:13px;color:#635d4a;">${value}</td>
        </tr>`;

  const paymentMethod = (order?.paymentMethod || order?.mode || "").toUpperCase();
  const paymentStatus = order?.paymentStatus || "Pending";

  const logoSection = logoUrl
    ? `<img src="${logoUrl}" alt="MMMK Wode" height="60" style="height:60px;max-width:220px;display:block;margin:0 auto;" />`
    : `<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#ded7d1;letter-spacing:4px;margin:0;">MMMK WODE</h1>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed – MMMK Wode</title>
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
              <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;color:#8b5e4b;text-transform:uppercase;">Luxury Fashion</p>
            </td>
          </tr>

          <!-- ── CONFIRMATION BADGE ── -->
          <tr>
            <td style="background-color:#3d1e10;padding:22px 40px;text-align:center;">
              <table align="center" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#635d4a;border-radius:50%;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#e6ffcc;font-size:20px;line-height:36px;">✓</span>
                  </td>
                  <td style="padding-left:14px;">
                    <h2 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#f9f5f2;letter-spacing:1px;">Order Confirmed</h2>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#8b5e4b;letter-spacing:1px;">ORDER NUMBER</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#ded7d1;letter-spacing:2px;">#${orderId}</p>
              <p style="margin:10px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#8b5e4b;">Placed on ${orderDate}</p>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="padding:36px 40px 0;">

              <!-- Greeting -->
              <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#28120b;">
                Dear ${customerName},
              </p>
              <!-- Admin custom message -->
              <div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#635d4a;margin:0 0 32px;">
                ${customMessage || "Thank you for your order! We are thrilled to have you as part of the MMMK Wode family."}
              </div>

              <!-- Divider -->
              <div style="border-top:1px solid #ede8e4;margin-bottom:28px;"></div>

              <!-- ORDER ITEMS heading -->
              <h3 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-weight:400;color:#8b5e4b;letter-spacing:3px;text-transform:uppercase;">Your Items</h3>

              <!-- Products table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #ece8e4;">
                ${productsHtml || `<tr><td colspan="3" style="padding:20px;text-align:center;color:#8b5e4b;font-family:Arial,sans-serif;font-size:13px;">No items found</td></tr>`}
              </table>

              <!-- Divider -->
              <div style="border-top:1px solid #ede8e4;margin:28px 0 24px;"></div>

              <!-- ORDER SUMMARY -->
              <h3 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-weight:400;color:#8b5e4b;letter-spacing:3px;text-transform:uppercase;">Order Summary</h3>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                ${summaryRow("Subtotal", subtotal)}
                ${summaryRow("Shipping", shipping)}
                ${(price.discount || 0) > 0 ? summaryRow("Discount", discount) : ""}
                ${(price.couponDiscount || 0) > 0 ? summaryRow("Coupon Discount", couponDiscount) : ""}
                ${(price.creditApplied || 0) > 0 ? summaryRow("Credits Applied", creditApplied) : ""}
                ${summaryRow("Total", total, true)}
              </table>

              <!-- Payment & Delivery info row -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td width="50%" style="padding-right:12px;vertical-align:top;">
                    <div style="background:#f9f5f2;border:1px solid #ede8e4;border-radius:4px;padding:18px;">
                      <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:2px;color:#8b5e4b;text-transform:uppercase;">Payment</p>
                      <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;color:#28120b;font-weight:600;">${paymentMethod || "—"}</p>
                      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#635d4a;">Status: ${paymentStatus}</p>
                    </div>
                  </td>
                  <td width="50%" style="padding-left:12px;vertical-align:top;">
                    <div style="background:#f9f5f2;border:1px solid #ede8e4;border-radius:4px;padding:18px;">
                      <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:2px;color:#8b5e4b;text-transform:uppercase;">Shipping To</p>
                      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#28120b;line-height:1.7;">${addrLine || "—"}</p>
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background-color:#28120b;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:400;color:#ded7d1;letter-spacing:1px;">
                Thank you for choosing MMMK Wode
              </p>
              <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:12px;color:#8b5e4b;line-height:1.6;">
                Questions? Contact our support team.
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

module.exports = { buildOrderConfirmationHtml };
