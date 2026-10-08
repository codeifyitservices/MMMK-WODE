const Order = require("../../../Models/Order");
const {
  sendOrderToJura,
  extractJuraOrderId,
  sendOrderUpdateToJura,
} = require("../../../utils/juraDelivery");
const {
  sendReturnExchangeToJura,
  extractJuraActionId,
} = require("../../../utils/juraReturnExchange");
const {
  restockItems,
  deductItems,
  validateStockAvailability,
} = require("../../../utils/stockService");
const Product = require("../../../Models/Product");
const { localizeValue } = require("../../../utils/localization");
const { CURRENCY_CONFIG, resolveCurrencyCode } = require("../../../utils/currency");
const { CheckoutAmountMismatchError } = require("../../../utils/checkoutCalculator");

const ALLOWED_ORDER_STATUSES = ["Pending", "Processing", "Complete", "Cancelled"];
const ALLOWED_DELIVERY_STATUSES = [
  "Pending",
  "Processing",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Failed",
  "Returned",
];
const ALLOWED_PAYMENT_STATUSES = ["Pending", "Paid", "Failed"];

const normalizeOrderProducts = async (products = [], existingOrder = null) => {
  if (!Array.isArray(products) || !products.length) {
    throw new Error("Products must be a non-empty array");
  }

  const normalizedProducts = await Promise.all(
    products.map(async (item, index) => {
      const quantity = Number(item?.quantity || 0);
      const amount = Number(item?.amount || 0);
      const sku = String(item?.sku || "").trim();
      const productId =
        item?.id?._id ||
        item?.id ||
        item?.productId?._id ||
        item?.productId ||
        null;

      if (!sku) {
        throw new Error(`Product ${index + 1} is missing SKU`);
      }

      if (!productId) {
        throw new Error(`Product ${index + 1} is missing product id`);
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Product ${index + 1} has invalid quantity`);
      }

      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`Product ${index + 1} has invalid amount`);
      }

      let name = String(item?.name || item?.productName || "").trim();

      if (!name) {
        const existingItem = (existingOrder?.products || []).find(
          (orderItem) =>
            String(orderItem?.sku || "") === sku &&
            String(orderItem?.id?._id || orderItem?.id || "") === String(productId)
        );

        name = String(existingItem?.name || "").trim();
      }

      if (!name) {
        const productDoc = await Product.findById(productId).select("productName").lean();
        name = localizeValue(productDoc?.productName, "en") || "Product";
      }

      return {
        id: productId,
        sku,
        name,
        quantity,
        amount,
      };
    })
  );

  return normalizedProducts;
};

const buildPriceFromProducts = (products = [], existingPrice = {}) => {
  const subtotal = products.reduce(
    (sum, item) => sum + Number(item?.amount || 0),
    0
  );
  const shippingCharges = Number(existingPrice?.shippingCharges || 0);
  const discount = Number(existingPrice?.discount || 0);
  const tax = Number(existingPrice?.tax || 0);
  const extraCharges = Number(existingPrice?.extraCharges || 0);
  const couponDiscount = Number(existingPrice?.couponDiscount || 0);
  const creditApplied = Number(existingPrice?.creditApplied || 0);
  const total =
    subtotal +
    shippingCharges +
    tax +
    extraCharges -
    discount -
    couponDiscount -
    creditApplied;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    shippingCharges: Number(shippingCharges.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    extraCharges: Number(extraCharges.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    creditApplied: Number(creditApplied.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};

const buildStockDeltas = (existingProducts = [], updatedProducts = []) => {
  const existingMap = new Map();
  const updatedMap = new Map();

  const buildKey = (item) =>
    `${String(item?.id?._id || item?.id || item?.productId || "")}::${String(
      item?.sku || ""
    )}`;

  for (const item of existingProducts) {
    existingMap.set(buildKey(item), {
      productId: item?.id?._id || item?.id || item?.productId || null,
      sku: item?.sku || "",
      name: item?.name || "Product",
      quantity: Number(item?.quantity || 0),
    });
  }

  for (const item of updatedProducts) {
    updatedMap.set(buildKey(item), {
      productId: item?.id?._id || item?.id || item?.productId || null,
      sku: item?.sku || "",
      name: item?.name || "Product",
      quantity: Number(item?.quantity || 0),
    });
  }

  const keys = new Set([...existingMap.keys(), ...updatedMap.keys()]);
  const restockDelta = [];
  const deductDelta = [];

  for (const key of keys) {
    const existingItem = existingMap.get(key);
    const updatedItem = updatedMap.get(key);
    const existingQty = Number(existingItem?.quantity || 0);
    const updatedQty = Number(updatedItem?.quantity || 0);
    const delta = updatedQty - existingQty;

    if (delta > 0) {
      deductDelta.push({
        productId: updatedItem?.productId || existingItem?.productId || null,
        sku: updatedItem?.sku || existingItem?.sku || "",
        name: updatedItem?.name || existingItem?.name || "Product",
        quantity: delta,
      });
    } else if (delta < 0) {
      restockDelta.push({
        productId: existingItem?.productId || updatedItem?.productId || null,
        sku: existingItem?.sku || updatedItem?.sku || "",
        name: existingItem?.name || updatedItem?.name || "Product",
        quantity: Math.abs(delta),
      });
    }
  }

  return { restockDelta, deductDelta };
};

const createOrder = async (req, res) => {
  try {
    const data = req.body;
    const savedData = await Order.create(data);
    const populatedOrder = await Order.findById(savedData._id).populate("userId").populate("products.id");

    try {
      const response = await sendOrderToJura(populatedOrder);
      const juraOrderId = extractJuraOrderId(response) || populatedOrder.orderId;

      await Order.findByIdAndUpdate(savedData._id, {
        $set: {
          depoter_order_id: juraOrderId,
          depoterSyncStatus: "Synced",
          depoterSyncedAt: new Date(),
          depoterSyncError: "",
          temp: {
            ...(savedData.temp || {}),
            juraResponse: response,
            juraSyncedAt: new Date().toISOString(),
          },
        },
      });

      
    } catch (apiError) {
      console.error("Error sending order to Jura API:", apiError.message);
      await Order.findByIdAndUpdate(savedData._id, {
        $set: {
          depoterSyncStatus: "Failed",
          depoterSyncError:
            apiError?.response?.data?.message ||
            apiError?.response?.data?.error ||
            apiError.message ||
            "Failed to sync with Jura",
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: savedData,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAll = async (req, res) => {
  try {
    const {
      searchKey,
      searchValue,
      currentPage = 1,
      pageSize = 10,
    } = req.query;

    const matchStage = {};

    if (searchKey && searchValue) {
      switch (searchKey) {
        case "orderId":
          matchStage.orderId = { $regex: searchValue, $options: "i" };
          break;
        case "customerName":
          matchStage["userId.firstName"] = { $regex: searchValue, $options: "i" };
          break;
        case "customerEmail":
          matchStage["userId.email"] = { $regex: searchValue, $options: "i" };
          break;
      }
    }
        
    const skip = (parseInt(currentPage) - 1) * parseInt(pageSize);

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId"
        }
      },
      { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "products",
          localField: "products.id",
          foreignField: "_id",
          as: "products"
        }
      },
      {
        $addFields: {
          displayAmountUSD: {
            $cond: {
              if: { $gt: [{ $ifNull: ["$amountUSD", 0] }, 0] },
              then: "$amountUSD",
              else: {
                $cond: {
                  if: { $gt: [{ $ifNull: ["$temp.amountBase.payableTotal", 0] }, 0] },
                  then: "$temp.amountBase.payableTotal",
                  else: {
                    $switch: {
                      branches: Object.keys(CURRENCY_CONFIG).map((code) => ({
                        case: { $eq: [{ $ifNull: ["$currency", "USD"] }, code] },
                        then: { $multiply: ["$amount", CURRENCY_CONFIG[code].rate] }
                      })),
                      default: "$amount"
                    }
                  }
                }
              }
            }
          },
          displayAmountOriginal: "$amount",
          displayPendingAmount: {
            $cond: {
              if: { $eq: ["$mode", "cod"] },
              then: { $ifNull: ["$amountDueCOD", "$price.payableTotal", "$amount"] },
              else: 0
            }
          },
          displayCurrency: { $ifNull: ["$currency", "USD"] }
        }
      },
      { $match: matchStage },
      { $sort: { createdAt: -1 } }
    ];

    const data = await Order.aggregate([
      ...pipeline,
      { $skip: skip },
      { $limit: parseInt(pageSize) }
    ]);

    const totalResults = await Order.aggregate([
      ...pipeline,
      { $count: "total" }
    ]);

    const total = totalResults.length > 0 ? totalResults[0].total : 0;

    res.status(200).json({
      success: true,
      message: "Order fetch successfully",
      data,
      total,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
const getSingle = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Order.findById(id);
    res.status(200).json({
      success: true,
      message: "Order fetch successfully",
      data,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('[DEBUG_ADMIN_UPDATE] Received update for order:', id, 'Body:', req.body);
    const { status, deliveryStatus, paymentStatus, products } = req.body || {};

    const currentOrder = await Order.findById(id);

    if (!currentOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updatePayload = {};

    if (status !== undefined) {
      if (!ALLOWED_ORDER_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status",
        });
      }
      updatePayload.status = status;
    }

    if (deliveryStatus !== undefined) {
      if (!ALLOWED_DELIVERY_STATUSES.includes(deliveryStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid delivery status",
        });
      }
      updatePayload.deliveryStatus = deliveryStatus;
    }

    if (paymentStatus !== undefined) {
      if (!ALLOWED_PAYMENT_STATUSES.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment status",
        });
      }

      updatePayload.paymentStatus = paymentStatus;
    }
    console.log('[DEBUG_ADMIN_UPDATE] Update Payload:', updatePayload);

    if (products !== undefined) {
      try {
        const normalizedProducts = await normalizeOrderProducts(products, currentOrder);
        const computedPrice = buildPriceFromProducts(normalizedProducts, currentOrder.price);
        const totalQuantity = normalizedProducts.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        );

        updatePayload.products = normalizedProducts;
        updatePayload.totalQuantity = totalQuantity;
        updatePayload.price = computedPrice;
        updatePayload.amount = computedPrice.total;

        const rate = currentOrder.currencyRate || CURRENCY_CONFIG[resolveCurrencyCode(currentOrder.currency)]?.rate || 1;
        updatePayload.amountUSD = Number((computedPrice.total * rate).toFixed(2));

        if (currentOrder.stockAdjusted) {
          const { restockDelta, deductDelta } = buildStockDeltas(
            currentOrder.products || [],
            normalizedProducts
          );

          if (deductDelta.length) {
            await validateStockAvailability(deductDelta);
          }

          if (restockDelta.length) {
            await restockItems(restockDelta);
          }

          if (deductDelta.length) {
            await deductItems(deductDelta);
          }
        } else {
          await validateStockAvailability(normalizedProducts);
        }
      } catch (productError) {
        return res.status(400).json({
          success: false,
          message: productError.message,
        });
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const savedData = await Order.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });
    console.log('[DEBUG_ADMIN_UPDATE] Saved Data:', savedData);
    
    try {
      const orderForSync = await Order.findById(savedData._id).populate("products.id");
      const juraResponse = await sendOrderUpdateToJura(orderForSync);
      
      const syncedOrder = await Order.findByIdAndUpdate(
        savedData._id,
        {
          $set: {
            depoterSyncStatus: "Synced",
            depoterSyncedAt: new Date(),
            depoterSyncError: "",
            temp: {
              ...(orderForSync?.temp || {}),
              juraUpdateResponse: juraResponse,
              juraUpdatedAt: new Date().toISOString(),
            },
          },
        },
        { new: true }
      );
      
      return res.status(200).json({
        success: true,
        message: "Order updated and synced with Jura successfully",
        data: syncedOrder,
        juraResponse,
      });
    } catch (juraErr) {
      console.error("[JURA_SYNC_FAIL] Order updated locally but Jura sync failed:", juraErr.message);
      
      // Update order status to Failed sync
      const failedSyncOrder = await Order.findByIdAndUpdate(
        savedData._id,
        {
          $set: {
            depoterSyncStatus: "Failed",
            depoterSyncError: juraErr.message || "Failed to sync with Jura"
          }
        },
        { new: true }
      );

      // Still return 200 because the local update succeeded
      return res.status(200).json({
        success: true,
        message: "Order updated locally, but failed to sync with Jura: " + juraErr.message,
        data: failedSyncOrder,
        juraError: juraErr.message
      });
    }

  } catch (err) {
    
    if (err instanceof CheckoutAmountMismatchError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        details: err.details,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const id = req.params.id;
    await Order.findByIdAndDelete(id);
    res.status(201).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const processReturnExchange = async (req, res) => {
  try {
    const { orderId, requestId } = req.params;
    const { decision, reviewNote = "" } = req.body || {};

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be either approve or reject",
      });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const requests = order.returnExchangeRequests || [];
    const requestIndex = requests.findIndex(
      (request) => request?.requestId === requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Return/exchange request not found",
      });
    }

    const request = requests[requestIndex];
    if (!["Pending", "Approved", "JuraSyncFailed"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    request.reviewedAt = new Date();
    request.reviewNote = String(reviewNote || "").trim();

    if (req?.admin?.id) {
      request.reviewedBy = req.admin.id;
    }

    if (decision === "reject") {
      request.status = "Rejected";
      request.juraSyncStatus = "Failed";
      request.juraSyncError = "Request rejected by admin";
      order.returnExchangeRequests[requestIndex] = request;
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Return/exchange request rejected",
        data: request,
      });
    }

    request.status = "Approved";
    request.juraSyncStatus = "Pending";
    request.juraSyncError = "";
    order.returnExchangeRequests[requestIndex] = request;
    await order.save();

    if (request.type === "exchange") {
      const exchangeItems = request?.exchangeDetails?.requestedItems || [];
      if (exchangeItems.length) {
        await validateStockAvailability(exchangeItems);
      }
    }

    try {
      const juraResponse = await sendReturnExchangeToJura({ order, request });
      const juraActionId = extractJuraActionId(juraResponse) || request.requestId;

      if (request.type === "return") {
        await restockItems(request.items || []);
      } else if (request.type === "exchange") {
        await restockItems(request.items || []);
        await deductItems(request?.exchangeDetails?.requestedItems || []);
      }

      request.status = "SyncedToJura";
      request.juraSyncStatus = "Synced";
      request.juraSyncError = "";
      request.juraActionId = juraActionId;
      request.juraSyncedAt = new Date();
      request.juraResponse = juraResponse;

      order.returnExchangeRequests[requestIndex] = request;
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Return/exchange request approved and synced to Jura",
        data: request,
      });
    } catch (juraErr) {
      const juraResponseData = juraErr?.response?.data || null;

      request.status = "JuraSyncFailed";
      request.juraSyncStatus = "Failed";
      request.juraSyncError =
        juraResponseData?.message ||
        juraResponseData?.error ||
        juraErr.message ||
        "Failed to sync return/exchange request with Jura";
      request.juraResponse = juraResponseData;

      order.returnExchangeRequests[requestIndex] = request;
      await order.save();

      return res.status(502).json({
        success: false,
        message: "Approved request could not be synced to Jura",
        data: request,
      });
    }
  } catch (err) {
    console.error("Error processing return/exchange request:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to process return/exchange request",
    });
  }
};

module.exports = {
  createOrder,
  getAll,
  getSingle,
  updateStatus,
  deleteOrder,
  processReturnExchange,
};
