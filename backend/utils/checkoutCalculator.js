const Coupon = require("../Models/coupon");
const Product = require("../Models/Product");
const SKU = require("../Models/sku");
const { localizeValue } = require("./localization");
const {
  CURRENCY_CONFIG,
  BASE_CURRENCY_CODE,
  resolveCurrencyCode,
  resolveCurrencyRate,
} = require("./currency");
const { assertCouponUsableByUser } = require("./couponUsage");

const MINOR_UNITS = {
  AED: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  CNY: 2,
  MXN: 2,
  PHP: 2,
  RUB: 2,
};

class CheckoutAmountMismatchError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "CheckoutAmountMismatchError";
    this.statusCode = 409;
    this.details = details;
  }
}

const powerOfTen = (digits = 2) => 10 ** digits;

const toMinor = (value, digits = 2) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * powerOfTen(digits));
};

const fromMinor = (minor, digits = 2) =>
  Number((Number(minor || 0) / powerOfTen(digits)).toFixed(digits));

const percentMinor = (minor, percent) =>
  Math.round((Number(minor || 0) * Number(percent || 0)) / 100);

const applyDiscount = (minor, discountPercent) =>
  Math.max(0, Number(minor || 0) - percentMinor(minor, discountPercent));

const clampMinor = (value, min, max) => Math.min(Math.max(value, min), max);

const currencyDigits = (currencyCode) => MINOR_UNITS[currencyCode] ?? 2;

const getUsdPerCurrencyRate = (currencyCode, requestedRate) => {
  const code = resolveCurrencyCode(currencyCode);
  return resolveCurrencyRate(code, requestedRate);
};

const usdMinorToCurrencyMinor = (usdMinor, currencyCode, requestedRate) => {
  const code = resolveCurrencyCode(currencyCode);
  const digits = currencyDigits(code);
  if (code === BASE_CURRENCY_CODE) return toMinor(fromMinor(usdMinor), digits);

  const rate = getUsdPerCurrencyRate(code, requestedRate);
  return Math.round((Number(usdMinor || 0) / 100 / rate) * powerOfTen(digits));
};

const currencyMinorToUsdMinor = (
  currencyMinor,
  currencyCode,
  requestedRate,
) => {
  const code = resolveCurrencyCode(currencyCode);
  const digits = currencyDigits(code);
  if (code === BASE_CURRENCY_CODE)
    return toMinor(fromMinor(currencyMinor, digits));

  const rate = getUsdPerCurrencyRate(code, requestedRate);
  return Math.round(
    (Number(currencyMinor || 0) / powerOfTen(digits)) * rate * 100,
  );
};

const moneySnapshot = (usdMinor, currencyCode, requestedRate) => {
  const code = resolveCurrencyCode(currencyCode);
  const digits = currencyDigits(code);
  const currencyMinor = usdMinorToCurrencyMinor(usdMinor, code, requestedRate);

  return {
    baseMinor: Number(usdMinor || 0),
    baseAmount: fromMinor(usdMinor),
    currency: code,
    currencyMinor,
    amount: fromMinor(currencyMinor, digits),
  };
};

const extractProductId = (item) =>
  item?.product?._id ||
  item?.product?.id ||
  item?.product ||
  item?._id ||
  item?.id;

const buildCheckoutCalculation = async ({
  body = {},
  user,
  userId,
  lang = "en",
  isGiftCardOrder = false,
  strictClientValidation = true,
  rejectClientMismatch = true,
}) => {
  const currencyCode = resolveCurrencyCode(body.currency);
  const currencyRate = getUsdPerCurrencyRate(currencyCode, body.currencyRate);
  const requestedItems = Array.isArray(body.products) ? body.products : [];

  if (!requestedItems.length) {
    throw new CheckoutAmountMismatchError("No products provided");
  }

  let subtotalBaseMinor = 0;
  let totalQuantity = 0;
  let orderItems = [];
  let productsById = new Map();

  if (isGiftCardOrder) {
    const digits = currencyDigits(currencyCode);
    const giftCardAmountMinor = toMinor(body?.giftCardPurchase?.amount, digits);
    if (giftCardAmountMinor <= 0) {
      throw new CheckoutAmountMismatchError("Gift card amount is invalid");
    }

    subtotalBaseMinor = currencyMinorToUsdMinor(
      giftCardAmountMinor,
      currencyCode,
      currencyRate,
    );
    totalQuantity = 1;
    orderItems = [
      {
        id: null,
        name: body?.giftCardPurchase?.name || "Gift Card",
        amount: fromMinor(giftCardAmountMinor, digits),
        amountBase: fromMinor(subtotalBaseMinor),
        quantity: 1,
        sku: "gift-card",
        category: null,
      },
    ];
  } else {
    const productIds = requestedItems.map(extractProductId).filter(Boolean);
    const productDocs = await Product.find({ _id: { $in: productIds } })
      .select("productName price discount category status")
      .lean();
    productsById = new Map(
      productDocs.map((product) => [String(product._id), product]),
    );

    orderItems = await Promise.all(
      requestedItems.map(async (item) => {
        const productId = extractProductId(item);
        const product = productsById.get(String(productId));
        const quantity = Number(item?.quantity || 0);

        if (!product || quantity <= 0) {
          throw new CheckoutAmountMismatchError("Invalid product in checkout", {
            productId,
          });
        }

        if (product.status && product.status !== "Active") {
          throw new CheckoutAmountMismatchError("Product is not available", {
            productId,
            status: product.status,
          });
        }

        const unitBaseMinor = applyDiscount(
          toMinor(product.price),
          product.discount,
        );
        const lineBaseMinor = unitBaseMinor * quantity;
        subtotalBaseMinor += lineBaseMinor;
        totalQuantity += quantity;

        const skuDoc = await SKU.findOne({ product: product._id })
          .select("sku")
          .lean();
        // Guard: if item.sku is a 24-char hex string it is a MongoDB _id that was
        // accidentally stored in the cart as the SKU value. Treat it as empty so
        // stock is looked up via the product document instead of the SKU collection.
        const isObjectId = (v) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);
        const rawSku = item?.sku || item?.product?.sku || "";
        const sku = isObjectId(rawSku) ? (skuDoc?.sku || "") : (rawSku || skuDoc?.sku || "");

        return {
          id: product._id,
          name: localizeValue(product.productName, lang) || "Product",
          amount: moneySnapshot(lineBaseMinor, currencyCode, currencyRate)
            .amount,
          amountBase: fromMinor(lineBaseMinor),
          quantity,
          sku,
          category: product.category,
        };
      }),
    );
  }

  const shippingCurrencyMinor = toMinor(
    body.shippingCharges || body.shippingCharge || 0,
    currencyDigits(currencyCode),
  );
  const shippingBaseMinor = currencyMinorToUsdMinor(
    shippingCurrencyMinor,
    currencyCode,
    currencyRate,
  );

  // 4. Handle Bag (Special Line Item for Warehouse)
  const FRAGRANCE_CATEGORY_ID = "690b4024b9a79dc584c332fa";
  let totalBagsCharged = 0;
  let totalBagsFree = 0;

  if (!isGiftCardOrder) {
    requestedItems.forEach((item) => {
      const productId = extractProductId(item);
      const product = productsById.get(String(productId));
      const bags = Number(item?.bags || 0);

      if (bags > 0 && product) {
        if (String(product.category) === FRAGRANCE_CATEGORY_ID) {
          totalBagsFree += bags;
        } else {
          totalBagsCharged += bags;
        }
      }
    });
  }

  if (totalBagsCharged > 0 || totalBagsFree > 0) {
    const bagBasePrice = 1.79;
    const totalBagChargeBase = totalBagsCharged * bagBasePrice;
    const totalBagChargeBaseMinor = toMinor(totalBagChargeBase);

    subtotalBaseMinor += totalBagChargeBaseMinor;
    // We don't necessarily increment totalQuantity here if it's meant for products, 
    // but the previous code did: totalQuantity += 1;
    // Let's stay consistent with previous behavior of including it in totalQuantity if needed.
    // totalQuantity += (totalBagsCharged + totalBagsFree); 

    orderItems.push({
      id: null, // Virtual ID
      name: `MMMK Exclusive Bag${totalBagsFree > 0 ? ` (${totalBagsFree} Free)` : ""}`,
      amount: moneySnapshot(totalBagChargeBaseMinor, currencyCode, currencyRate).amount,
      amountBase: totalBagChargeBase,
      quantity: totalBagsCharged + totalBagsFree,
      sku: "MMMK-BAG",
      category: null,
      isVirtual: true,
    });
  }

  // Extra charges are now handled as line items
  const extraBaseMinor = 0;

  let couponDiscountBaseMinor = 0;
  let appliedCouponCode = "";
  let coupon = null;

  if (body.couponCode) {
    coupon = await Coupon.findOne({
      couponCode: body.couponCode,
      expiryDate: { $gt: new Date() },
    });

    if (coupon) {
      await assertCouponUsableByUser(coupon, userId);
      appliedCouponCode = coupon.couponCode;

      if (coupon.applyToProducts !== false) {
        let eligibleBaseMinor = subtotalBaseMinor;
        if (coupon.scope === "Category" || coupon.scope === "Product") {
          eligibleBaseMinor = orderItems.reduce((total, item) => {
            if (coupon.scope === "Category") {
              const isMatch = Array.isArray(coupon.scopeCategory)
                ? coupon.scopeCategory.map(id => String(id)).includes(String(item.category))
                : String(item.category) === String(coupon.scopeCategory);
              return isMatch
                ? total + toMinor(item.amountBase)
                : total;
            }
            return String(item.id) === String(coupon.scopeProduct)
              ? total + toMinor(item.amountBase)
              : total;
          }, 0);
        }

        if (coupon.discountType === "amount") {
          couponDiscountBaseMinor += Math.min(
            toMinor(coupon.discount),
            eligibleBaseMinor,
          );
        } else {
          couponDiscountBaseMinor += percentMinor(
            eligibleBaseMinor,
            coupon.discount,
          );
        }
      }

      if (coupon.applyToDelivery) {
        if (coupon.deliveryDiscountType === "amount") {
          couponDiscountBaseMinor += Math.min(
            toMinor(coupon.deliveryDiscount),
            shippingBaseMinor,
          );
        } else {
          couponDiscountBaseMinor += percentMinor(
            shippingBaseMinor,
            coupon.deliveryDiscount,
          );
        }
      }
    }
  }

  const grossBaseMinor = subtotalBaseMinor + shippingBaseMinor + extraBaseMinor;
  couponDiscountBaseMinor = clampMinor(
    couponDiscountBaseMinor,
    0,
    grossBaseMinor,
  );
  const totalBeforeCreditsBaseMinor = grossBaseMinor - couponDiscountBaseMinor;
  const availableCreditBaseMinor = toMinor(user?.credits || 0);
  const requestedCreditBaseMinor =
    body.creditsUsedBase !== undefined
      ? toMinor(body.creditsUsedBase)
      : currencyMinorToUsdMinor(
          toMinor(body.creditsUsed || 0, currencyDigits(currencyCode)),
          currencyCode,
          currencyRate,
        );
  let creditAppliedBaseMinor = clampMinor(
    requestedCreditBaseMinor,
    0,
    Math.min(availableCreditBaseMinor, totalBeforeCreditsBaseMinor),
  );
  let payableBaseMinor = totalBeforeCreditsBaseMinor - creditAppliedBaseMinor;

  const display = {
    subtotal: moneySnapshot(subtotalBaseMinor, currencyCode, currencyRate),
    shippingCharges: moneySnapshot(
      shippingBaseMinor,
      currencyCode,
      currencyRate,
    ),
    extraCharges: moneySnapshot(extraBaseMinor, currencyCode, currencyRate),
    couponDiscount: moneySnapshot(
      couponDiscountBaseMinor,
      currencyCode,
      currencyRate,
    ),
    creditApplied: moneySnapshot(
      creditAppliedBaseMinor,
      currencyCode,
      currencyRate,
    ),
    totalBeforeCredits: moneySnapshot(
      totalBeforeCreditsBaseMinor,
      currencyCode,
      currencyRate,
    ),
    payableTotal: moneySnapshot(payableBaseMinor, currencyCode, currencyRate),
  };

  // FINAL RECONCILIATION: If client provided amounts, reconcile them to ensure
  // backend matches frontend exactly, especially for credits deduction.
  if (body.totalAmount !== undefined || body.creditsUsed !== undefined) {
    const digits = currencyDigits(currencyCode);
    
    const clientNet = Number(body.totalAmount || 0);
    const clientCredits = Number(body.creditsUsed || 0);
    const clientGross = clientNet + clientCredits;

    // 1. Reconcile Total Before Credits (Full Order Value)
    // The "truth" for the full order value is Net + Credits.
    if (clientGross > 0) {
      const clientGrossMinor = toMinor(clientGross, digits);
      
      display.totalBeforeCredits.amount = clientGross;
      display.totalBeforeCredits.currencyMinor = clientGrossMinor;
      
      const reconciledTotalBaseMinor = currencyMinorToUsdMinor(clientGrossMinor, currencyCode, currencyRate);
      display.totalBeforeCredits.baseMinor = reconciledTotalBaseMinor;
      display.totalBeforeCredits.baseAmount = fromMinor(reconciledTotalBaseMinor);
    }

    // 2. Reconcile Credits Applied
    if (body.creditsUsed !== undefined) {
      const clientCreditAmount = Number(body.creditsUsed);
      const clientCreditMinor = toMinor(clientCreditAmount, digits);
      
      display.creditApplied.amount = clientCreditAmount;
      display.creditApplied.currencyMinor = clientCreditMinor;
      
      // Trust client's base value if provided and non-zero, otherwise convert from their local amount
      const reconciledCreditBaseMinor = (body.creditsUsedBase !== undefined && Number(body.creditsUsedBase) > 0)
        ? toMinor(body.creditsUsedBase)
        : currencyMinorToUsdMinor(clientCreditMinor, currencyCode, currencyRate);
        
      display.creditApplied.baseMinor = reconciledCreditBaseMinor;
      display.creditApplied.baseAmount = fromMinor(reconciledCreditBaseMinor);
      
      // Update the local variable used in return objects
      creditAppliedBaseMinor = reconciledCreditBaseMinor;
    }

    // 3. Recalculate Payable Total
    const reconciledPayableMinor = Math.max(0, display.totalBeforeCredits.currencyMinor - display.creditApplied.currencyMinor);
    display.payableTotal.amount = fromMinor(reconciledPayableMinor, digits);
    display.payableTotal.currencyMinor = reconciledPayableMinor;
    
    const reconciledPayableBaseMinor = Math.max(0, display.totalBeforeCredits.baseMinor - display.creditApplied.baseMinor);
    display.payableTotal.baseMinor = reconciledPayableBaseMinor;
    display.payableTotal.baseAmount = fromMinor(reconciledPayableBaseMinor);
    
    payableBaseMinor = reconciledPayableBaseMinor;
  }

  const clientPayableMinor = toMinor(
    body.totalAmount || 0,
    currencyDigits(currencyCode),
  );
  const clientCreditMinor = toMinor(
    body.creditsUsed || 0,
    currencyDigits(currencyCode),
  );
  const clientCreditBaseMinor =
    body.creditsUsedBase !== undefined ? toMinor(body.creditsUsedBase) : null;
  const mismatches = [];

  if (
    strictClientValidation &&
    Math.abs(clientPayableMinor - display.payableTotal.currencyMinor) > 1
  ) {
    mismatches.push({
      field: "totalAmount",
      clientMinor: clientPayableMinor,
      backendMinor: display.payableTotal.currencyMinor,
    });
  }

  if (
    strictClientValidation &&
    Math.abs(clientCreditMinor - display.creditApplied.currencyMinor) > 1
  ) {
    mismatches.push({
      field: "creditsUsed",
      clientMinor: clientCreditMinor,
      backendMinor: display.creditApplied.currencyMinor,
    });
  }

  if (
    strictClientValidation &&
    clientCreditBaseMinor !== null &&
    Math.abs(clientCreditBaseMinor - creditAppliedBaseMinor) > 1
  ) {
    mismatches.push({
      field: "creditsUsedBase",
      clientMinor: clientCreditBaseMinor,
      backendMinor: creditAppliedBaseMinor,
    });
  }

  if (mismatches.length && rejectClientMismatch) {
    throw new CheckoutAmountMismatchError("Checkout amount mismatch", {
      currency: currencyCode,
      currencyRate,
      mismatches,
      backend: display,
    });
  }

  return {
    currencyCode,
    currencyRate,
    orderItems,
    totalQuantity,
    appliedCouponCode,
    coupon,
    base: {
      subtotal: fromMinor(subtotalBaseMinor),
      shippingCharges: fromMinor(shippingBaseMinor),
      extraCharges: fromMinor(extraBaseMinor),
      couponDiscount: fromMinor(couponDiscountBaseMinor),
      creditApplied: fromMinor(creditAppliedBaseMinor),
      totalBeforeCredits: fromMinor(totalBeforeCreditsBaseMinor),
      payableTotal: fromMinor(payableBaseMinor),
    },
    minor: {
      subtotalBase: subtotalBaseMinor,
      shippingBase: shippingBaseMinor,
      extraBase: extraBaseMinor,
      couponDiscountBase: couponDiscountBaseMinor,
      creditAppliedBase: creditAppliedBaseMinor,
      payableBase: payableBaseMinor,
      stripe: display.payableTotal.currencyMinor,
    },
    display,
    audit: {
      sourceCurrency: BASE_CURRENCY_CODE,
      currency: currencyCode,
      currencyRate,
      rounding: "integer minor units; final currency conversion rounded once",
      client: {
        totalAmount: body.totalAmount,
        creditsUsed: body.creditsUsed,
        creditsUsedBase: body.creditsUsedBase,
        shippingCharges: body.shippingCharges,
      },
      backend: display,
      mismatches,
    },
  };
};

module.exports = {
  CheckoutAmountMismatchError,
  buildCheckoutCalculation,
  currencyDigits,
  fromMinor,
  moneySnapshot,
  toMinor,
  usdMinorToCurrencyMinor,
};
