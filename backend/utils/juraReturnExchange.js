const axios = require("axios");
const { getJuraConfig } = require("./juraConfig");

const getJuraActionUrl = (type) => {
  const {
    baseUrl,
    headers,
  } = getJuraConfig();

  const returnUrl =
    process.env.JURA_RETURN_URL?.trim() ||
    process.env.JURAA_RETURN_URL?.trim() ||
    "";
  const exchangeUrl =
    process.env.JURA_EXCHANGE_URL?.trim() ||
    process.env.JURAA_EXCHANGE_URL?.trim() ||
    "";

  const configuredUrl = type === "return" ? returnUrl : exchangeUrl;
  if (configuredUrl) {
    return { url: configuredUrl, headers };
  }

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const fallbackUrl =
    type === "return"
      ? `${normalizedBaseUrl}order/return`
      : `${normalizedBaseUrl}order/exchange`;

  return { url: fallbackUrl, headers };
};

const extractJuraActionId = (payload) => {
  const candidates = [
    payload?.actionId,
    payload?.returnId,
    payload?.exchangeId,
    payload?.requestId,
    payload?.id,
    payload?.data?.actionId,
    payload?.data?.returnId,
    payload?.data?.exchangeId,
    payload?.data?.requestId,
    payload?.data?.id,
    payload?.result?.actionId,
    payload?.result?.returnId,
    payload?.result?.exchangeId,
    payload?.result?.requestId,
    payload?.result?.id,
  ];

  return (
    candidates.find((value) => typeof value === "string" && value.trim()) || ""
  );
};

const buildJuraReturnExchangePayload = (order, request) => {
  const shippingAddress = order?.shippingAddress || {};
  const billingAddress = order?.billingAddress || shippingAddress;

  return {
    actionType: request?.type,
    requestId: request?.requestId,
    orderReferenceNumber: order?.orderId,
    juraOrderId: order?.jura_order_id || order?.depoter_order_id || "",
    reason: request?.reason || "",
    notes: request?.notes || "",
    requestedAt: request?.requestedAt || new Date(),
    paymentStatus: order?.paymentStatus || "Pending",
    amount: {
      currency: order?.currency || "USD",
      subTotal: order?.price?.subtotal || 0,
      total: order?.price?.total || order?.amount || 0,
    },
    shippingAddress: {
      name: `${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}`.trim(),
      phone: shippingAddress.phoneNumber || "",
      addressLine1: shippingAddress.streetAddress || "",
      postalCode: shippingAddress.postalCode || "",
      city: shippingAddress.city || "",
      state: shippingAddress.state || "",
      country: shippingAddress.country || "",
    },
    billingAddress: {
      name: `${billingAddress.firstName || ""} ${billingAddress.lastName || ""}`.trim(),
      phone: billingAddress.phoneNumber || "",
      addressLine1: billingAddress.streetAddress || "",
      postalCode: billingAddress.postalCode || "",
      city: billingAddress.city || "",
      state: billingAddress.state || "",
      country: billingAddress.country || "",
    },
    lineItems: (request?.items || []).map((item) => ({
      sku: item?.sku || "",
      productId: item?.productId || "",
      quantity: Number(item?.quantity || 0),
      name: item?.name || "Product",
    })),
    exchange: request?.type === "exchange"
      ? {
          requestedItems: (request?.exchangeDetails?.requestedItems || []).map((item) => ({
            sku: item?.sku || "",
            quantity: Number(item?.quantity || 0),
          })),
          notes: request?.exchangeDetails?.notes || "",
        }
      : undefined,
  };
};

const sendReturnExchangeToJura = async ({ order, request }) => {
  const { url, headers } = getJuraActionUrl(request?.type);
  const payload = buildJuraReturnExchangePayload(order, request);

  const response = await axios.post(url, payload, {
    headers,
    validateStatus: () => true,
  });

  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }

  const error = new Error(
    response?.data?.message ||
      response?.data?.error ||
      `Jura action handover failed with status ${response.status}`
  );
  error.response = { data: response.data, status: response.status };
  throw error;
};

module.exports = {
  buildJuraReturnExchangePayload,
  extractJuraActionId,
  sendReturnExchangeToJura,
};
