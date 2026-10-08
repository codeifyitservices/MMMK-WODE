const axios = require("axios");
const { getJuraConfig } = require("./juraConfig");
const SKU = require("../Models/sku");
const { resolveCurrencyCode } = require("./currency");

const getJuraCreateUrl = () => {
  const { baseUrl, orderUrl } = getJuraConfig();

  if (orderUrl) return orderUrl;

  if (!baseUrl) return "";

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  if (normalizedBaseUrl.includes("/api/rest/v1/")) {
    return normalizedBaseUrl.endsWith("order/create")
      ? normalizedBaseUrl
      : `${normalizedBaseUrl}order/create`;
  }

  if (normalizedBaseUrl.includes("/rest/v1/")) {
    return normalizedBaseUrl.replace("/rest/v1/", "/api/rest/v1/order/create");
  }

  return `${normalizedBaseUrl}api/rest/v1/order/create`;
};

const getJuraUpdateUrl = (orderReferenceNumber) => {
  const { baseUrl } = getJuraConfig();

  if (!baseUrl) return "";

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const cleanOrderReferenceNumber = encodeURIComponent(
    String(orderReferenceNumber || "").trim()
  );

  if (!cleanOrderReferenceNumber) {
    throw new Error("Order reference number is required for Jura update");
  }

  if (normalizedBaseUrl.includes("/api/rest/v1")) {
    return `${normalizedBaseUrl}/order/update/${cleanOrderReferenceNumber}`;
  }

  if (normalizedBaseUrl.includes("/rest/v1")) {
    return normalizedBaseUrl.replace(
      /\/rest\/v1$/,
      `/api/rest/v1/order/update/${cleanOrderReferenceNumber}`
    );
  }

  return `${normalizedBaseUrl}/api/rest/v1/order/update/${cleanOrderReferenceNumber}`;
};

const getAddressField = (address, keys, fallback = "") => {
  for (const key of keys) {
    const value = address?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
};

const COUNTRY_CODE_MAP = {
  "UNITED ARAB EMIRATES": "AE",
  UAE: "AE",
  AE: "AE",
  INDIA: "IN",
  IN: "IN",
  "SAUDI ARABIA": "SA",
  SA: "SA",
  "KINGDOM OF SAUDI ARABIA": "SA",
};

const getAddressLine1 = (address) =>
  getAddressField(
    address,
    ["streetAddress", "street_address", "addressLine1", "address", "line1"],
    ""
  );

const getAddressPhone = (address) => {
  const phone = getAddressField(address, ["phoneNumber", "phone", "mobile"], "00000000");
  const sanitizedPhone = phone.replace(/^\+/, "");
  const telephoneCode = getAddressTelephoneCode(address).replace(/^\+/, "");

  let finalPhone = sanitizedPhone;
  if (telephoneCode && finalPhone.startsWith(telephoneCode)) {
    finalPhone = finalPhone.slice(telephoneCode.length);
  }

  // Ensure at least 8 characters as per Jura requirement
  return finalPhone.length < 8 ? finalPhone.padEnd(8, '0') : finalPhone;
};

const getAddressTelephoneCode = (address) => {
  const telephoneCode = getAddressField(address, ["telephoneCode"], "+971");
  if (!telephoneCode) return "+971";
  return telephoneCode.startsWith("+") ? telephoneCode : `+${telephoneCode}`;
};

const getAddressName = (address) =>
  getAddressField(address, ["name", "fullName"], "").trim();

const normalizeCountryCode = (value, fallback = "AE") => {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return fallback;
  }

  const normalizedValue = rawValue.toUpperCase();
  return COUNTRY_CODE_MAP[normalizedValue] || normalizedValue;
};

const resolvePaymentType = (order) => {
  if (order?.paymentStatus === "Paid") return "Paid";
  return "Pending";
};

const resolveJuraCurrency = (order) => {
  const existingCurrency =
    order?.temp?.juraResponse?.data?.amount?.currency ||
    order?.currency ||
    "AED";

  const normalized = resolveCurrencyCode(existingCurrency);
  return normalized || "AED";
};

const extractJuraOrderId = (payload) => {
  const candidates = [
    payload?.jura_order_id,
    payload?.juraa_order_id,
    payload?.depoter_order_id,
    payload?.order_id,
    payload?.orderId,
    payload?.data?.jura_order_id,
    payload?.data?.juraa_order_id,
    payload?.data?.depoter_order_id,
    payload?.data?.order_id,
    payload?.data?.orderId,
    payload?.data?.orderNumber,
    payload?.data?.id,
    payload?.id,
    payload?.result?.jura_order_id,
    payload?.result?.juraa_order_id,
    payload?.result?.depoter_order_id,
    payload?.result?.order_id,
    payload?.result?.orderNumber,
    payload?.result?.id,
    payload?.orderNumber,
  ];

  return (
    candidates.find((value) => typeof value === "string" && value.trim()) || ""
  );
};

const resolveOrderItemSku = async (item) => {
  const directSku = String(item?.sku || "").trim();
  if (directSku) {
    return directSku;
  }

  const productId =
    item?.id?._id || item?.id || item?.productId?._id || item?.productId || null;

  if (!productId) {
    return "";
  }

  const skuDoc = await SKU.findOne({ product: productId }).select("sku").lean();
  return String(skuDoc?.sku || "").trim();
};

const resolveOrderItemName = (item) => {
  const directName = String(item?.name || item?.productName || "").trim();
  if (directName) {
    return directName;
  }

  const populatedName = item?.id?.productName?.en || item?.productId?.productName?.en;
  return String(populatedName || "Product").trim();
};

const buildJuraLineItem = (item, resolvedSku = "") => {
  const quantity = Number(item?.quantity || 0);
  const amount = Number(item?.amount || 0);
  const unitPrice = quantity > 0 ? amount / quantity : amount;
  const sku = String(resolvedSku || item?.sku || "").trim();
  const productName = resolveOrderItemName(item);

  if (!sku) {
    throw new Error(
      `Missing SKU for order item "${productName}".`
    );
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(
      `Invalid quantity for order item "${productName}".`
    );
  }

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(
      `Invalid amount for order item "${productName}".`
    );
  }

  return {
    skuId: sku,
    sku,
    productName,
    quantity,
    price: unitPrice,
    amount,
  };
};

const buildJuraPayload = async (order) => {
  const shippingAddress = order?.shippingAddress || {};
  const billingAddress = order?.billingAddress || shippingAddress;
  const products = Array.isArray(order?.products) ? order.products : [];

  const shippingCountryCode = normalizeCountryCode(
    getAddressField(shippingAddress, ["countryCode", "country"], "AE"),
    "AE"
  );

  // ... (rest of the function - I'll need to reconstruct the function partially)
  // Actually, I can just replace the specific part if I have enough context.
  // The previous attempt failed because I didn't include enough context for the function boundaries.
  // Let's do it carefully.

  // Okay, let's just use the buildJuraPayload structure.

  // ... skipping directly to the object return ...

  // Actually, let's just fix the buildJuraPayload function entirely to ensure I have the context correct.

  const getCleanStateCode = (address, defaultCode) => {
    const rawState = getAddressField(
      address,
      ["stateCode", "state"],
      defaultCode
    ).toUpperCase();

    // Mapping for common UAE states if full names are provided
    const mapping = {
      DUBAI: "DU",
      "ABU DHABI": "AZ",
      SHARJAH: "SH",
      AJMAN: "AJ",
      "UMM AL QUWAIN": "UQ",
      "RAS AL KHAIMAH": "RK",
      FUJAIRAH: "FU",
    };

    if (mapping[rawState]) return mapping[rawState];

    return rawState.length > 3 ? defaultCode : rawState;
  };

  const shippingStateCode = getCleanStateCode(shippingAddress, "DU");
  const lineItems = [];

  for (const item of products) {
    const resolvedSku = await resolveOrderItemSku(item);
    lineItems.push(buildJuraLineItem(item, resolvedSku));
  }

  return {
    orderReferenceNumber: order?.orderId,
    deliveryType: "Next Day",
    shippingAddress: {
      name:
        `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim() ||
        getAddressName(shippingAddress),
      phone: getAddressPhone(shippingAddress),
      telephoneCode: getAddressTelephoneCode(shippingAddress),
      addressLine1: getAddressLine1(shippingAddress),
      postalCode: shippingAddress.postalCode || "",
      city: shippingAddress.city || "",
      state: shippingAddress.state || "",
      country: shippingAddress.country || "",
      stateCode: shippingStateCode,
      countryCode: shippingCountryCode,
    },
    billingAddress: {
      name:
        `${billingAddress.firstName || ""} ${billingAddress.lastName || ""}`.trim() ||
        getAddressName(billingAddress) || "N/A",
      addressLine1: getAddressLine1(billingAddress) || getAddressLine1(shippingAddress),
      city: billingAddress.city || shippingAddress.city || "",
      countryCode: normalizeCountryCode(
        getAddressField(billingAddress, ["countryCode", "country"], shippingCountryCode),
        "AE"
      ),
    },
    lineItems,
    amount: {
      currency: resolveJuraCurrency(order),
      subTotal: order?.price?.subtotal || 0,
      total: Math.max(0, Number(order?.price?.total || order?.amount || 0)),
      paymentType: resolvePaymentType(order),
    },
  };
};

const buildJuraUpdatePayload = async (order) => {
  const products = Array.isArray(order?.products) ? order.products : [];
  const acceptedLineItems = order?.temp?.juraResponse?.data?.lineItems;

  if (!products.length && Array.isArray(acceptedLineItems) && acceptedLineItems.length > 0) {
    return {
      lineItems: acceptedLineItems.map((item) => ({
        skuId: String(item?.skuId || item?.sku || "").trim(),
        sku: String(item?.sku || item?.skuId || "").trim(),
        productName: String(item?.productName || "Product").trim(),
        quantity: Number(item?.quantity || 0),
        price: Number(item?.price || 0),
        amount: Number(item?.amount || 0),
      })),
      amount: {
        currency: resolveJuraCurrency(order),
        subTotal: Number(order?.price?.subtotal || order?.amount || 0),
        total: Math.max(0, Number(order?.price?.total || order?.amount || 0)),
        paymentType: resolvePaymentType(order),
      },
    };
  }

  const lineItems = await Promise.all(
    products.map(async (item) => {
      const resolvedSku = await resolveOrderItemSku(item);
      return buildJuraLineItem(item, resolvedSku);
    })
  );

  return {
    lineItems,
    amount: {
      currency: resolveJuraCurrency(order),
      subTotal: Number(order?.price?.subtotal || 0),
      total: Math.max(0, Number(order?.price?.total || order?.amount || 0)),
      paymentType: resolvePaymentType(order),
    },
  };
};

const sendOrderToJura = async (order) => {
  const url = getJuraCreateUrl();
  const { headers } = getJuraConfig();

  if (!url) {
    throw new Error("Jura base URL is missing");
  }

  const payload = await buildJuraPayload(order);
  const response = await axios.post(url, payload, { headers });
  return response.data;
};

const sendOrderUpdateToJura = async (order) => {
  const orderReferenceNumber = order?.orderId;
  const url = getJuraUpdateUrl(orderReferenceNumber);
  const { headers } = getJuraConfig();

  if (!url) {
    throw new Error("Jura update URL is missing");
  }

  const payload = await buildJuraUpdatePayload(order);
  const response = await axios.put(url, payload, { headers });
  return response.data;
};

module.exports = {
  buildJuraPayload,
  buildJuraUpdatePayload,
  extractJuraOrderId,
  getJuraCreateUrl,
  getJuraUpdateUrl,
  sendOrderToJura,
  sendOrderUpdateToJura,
};
