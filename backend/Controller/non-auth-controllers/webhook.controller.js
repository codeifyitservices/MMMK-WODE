const SKU = require("../../Models/sku");
const Product = require("../../Models/Product");
const Order = require("../../Models/Order");

/**
 * Unified webhook handler for Jura events
 * Endpoint: POST /api/v1/webhook/jura
 *
 * Supported events:
 * - inventory_updated
 * - delivery_status_updated
 */
const handleJuraWebhook = async (req, res) => {
  try {
    const { event, data } = req.body;

    // Validate event type
    if (!event) {
      return res.status(400).json({
        success: false,
        message: "Missing event type",
      });
    }

    // Route to appropriate handler based on event type
    switch (event) {
      case "inventory_updated":
        return await handleInventoryUpdate(req, res, data);

      case "delivery_status_updated":
        return await handleDeliveryStatusUpdate(req, res, data);

      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported event type: ${event}`,
        });
    }
  } catch (error) {
    console.error("[WEBHOOK] Error processing webhook:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing webhook",
      error: error.message,
    });
  }
};

/**
 * Handle inventory update events
 */
const handleInventoryUpdate = async (req, res, data) => {
  try {
    // Validate required fields
    if (!data || !data.sku || data.newQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: sku and newQuantity are required",
      });
    }

    const { sku, newQuantity, variantIds, productIds } = data;

    // Find and update the SKU
    const skuRecord = await SKU.findOne({ sku: sku });

    if (!skuRecord) {
      console.warn(`[WEBHOOK] SKU not found: ${sku}`);
      return res.status(404).json({
        success: false,
        message: `SKU not found: ${sku}`,
      });
    }

    // Update the SKU quantity
    const oldQuantity = skuRecord.quantity;
    skuRecord.quantity = newQuantity;
    await skuRecord.save();

    // Update the product quantity if productIds are provided
    let updatedProducts = [];
    if (productIds && productIds.length > 0) {
      for (const productId of productIds) {
        const product = await Product.findById(productId);

        if (product) {
          // Calculate total quantity from all SKUs for this product
          const productSkus = await SKU.find({ product: productId });
          const totalQuantity = productSkus.reduce(
            (sum, sku) => sum + (sku.quantity || 0),
            0,
          );

          product.quantity = totalQuantity;

          // Update product status based on quantity
          if (totalQuantity === 0) {
            product.status = "Out of stock";
          } else if (product.status === "Out of stock") {
            product.status = "Active";
          }

          await product.save();
          updatedProducts.push({
            productId: product._id,
            productName: product.productName?.en || "Unknown",
            totalQuantity: totalQuantity,
            status: product.status,
          });
        }
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: {
        sku: sku,
        oldQuantity: oldQuantity,
        newQuantity: newQuantity,
        updatedProducts: updatedProducts,
      },
    });
  } catch (error) {
    console.error("[WEBHOOK] Error processing inventory update:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing inventory update",
      error: error.message,
    });
  }
};

/**
 * Handle delivery status update events
 */
const handleDeliveryStatusUpdate = async (req, res, data) => {
  try {
    // Validate required fields
    if (!data || !data.orderReferenceNumber || !data.trackingDetails) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: orderReferenceNumber and trackingDetails are required",
      });
    }

    const { orderReferenceNumber, trackingDetails } = data;
    const { status, shipper, awb, trackingUrl, notifyCustomer } =
      trackingDetails;

    // Find the order by orderId (reference number)
    const order = await Order.findOne({ orderId: orderReferenceNumber });

    if (!order) {
      console.warn(`[WEBHOOK] Order not found: ${orderReferenceNumber}`);
      return res.status(404).json({
        success: false,
        message: `Order not found: ${orderReferenceNumber}`,
      });
    }

    // Store old status for logging
    const oldDeliveryStatus = order.deliveryStatus;

    // Update delivery tracking information
    order.deliveryStatus = status;
    order.shipperName = shipper;
    order.awb = awb;
    order.trackingUrl = trackingUrl;
    order.notifyCustomer = notifyCustomer || false;

    // Add to tracking history
    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }

    order.trackingHistory.push({
      status: status,
      timestamp: new Date(),
      location: trackingDetails.location || "",
      remarks: trackingDetails.remarks || "",
    });

    // Update order status based on delivery status
    if (status === "Delivered") {
      order.status = "Complete";
      order.deliveryDate = new Date().toISOString();
    } else if (status === "Failed" || status === "Returned") {
      order.status = "Cancelled";
    } else if (status === "In Transit" || status === "Out for Delivery") {
      order.status = "Processing";
    }

    await order.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Delivery status updated successfully",
      data: {
        orderReferenceNumber: orderReferenceNumber,
        oldDeliveryStatus: oldDeliveryStatus,
        newDeliveryStatus: status,
        orderStatus: order.status,
        trackingDetails: {
          shipper: order.shipperName,
          awb: order.awb,
          trackingUrl: order.trackingUrl,
          notifyCustomer: order.notifyCustomer,
        },
      },
    });
  } catch (error) {
    console.error("[WEBHOOK] Error processing delivery status update:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while processing delivery status update",
      error: error.message,
    });
  }
};

module.exports = {
  handleJuraWebhook,
  handleInventoryUpdate,
  handleDeliveryStatusUpdate,
};
