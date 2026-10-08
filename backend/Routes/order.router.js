const express = require("express");
const router = express.Router();
const Order = require("../Models/Order");
const axios = require("axios");
const { getJuraConfig } = require("../utils/juraConfig");

// controller
const {
  createOrder,
  getAll,
  getSingle,
  updateStatus,
  deleteOrder,
  processReturnExchange,
} = require("../Controller/admin-controllers/order/order.controller");

// routes
router.get("/get-all", getAll);
router.get("/get-single/:id", getSingle);
router.get("/delete/:id", deleteOrder);
router.post("/create", createOrder);
router.post("/update/:id", updateStatus);
router.post("/process-return-exchange/:orderId/:requestId", processReturnExchange);

const checkJuraStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // First get the order from our database
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const juraOrderId = order.jura_order_id || order.depoter_order_id;

    if (!juraOrderId) {
      return res.status(400).json({
        success: false,
        message: "This order was not sent to Jura",
        order,
      });
    }

    // If we have a Jura ID, check its status
    let juraConfig;
    try {
      juraConfig = getJuraConfig();
    } catch (configError) {
      return res.status(400).json({
        success: false,
        message: configError.message,
        order,
      });
    }
    const { baseUrl, headers } = juraConfig;
    
    // Normalize baseUrl and construct tracking URL
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    // The user's requested API endpoint structure:
    const trackUrl = `${normalizedBaseUrl}/delivery/track/${orderId}`;
    
    const response = await axios.get(trackUrl, { headers });

    // Update order status in our database
    if (response.data && response.data.success !== false && response.data.response !== "false") {
      const data = response.data?.data || {};
      const statusComment = response.data?.status?.comment || {};
      const trackingDetails = data.trackingDetails || statusComment;
      
      // Determine new fields
      const newDeliveryStatus = data.orderStatus || data.deliveryStatus || statusComment.delivery_status || statusComment.status || order.deliveryStatus;
      const newOrderStatus = statusComment.order_status || order.status;
      
      const newShipper = trackingDetails.shipper || data.shipper || order.shipperName;
      const newAwb = trackingDetails.awb || data.awb || order.awb;
      const newTrackingUrl = trackingDetails.trackingUrl || trackingDetails.tracking_url || data.trackingUrl || order.trackingUrl;
      const newDeliveryDate = trackingDetails.deliveryDate || trackingDetails.delivery_date || data.deliveryDate || order.deliveryDate;

      const updatedOrder = await Order.findOneAndUpdate(
        { orderId },
        {
          status: newOrderStatus,
          deliveryStatus: newDeliveryStatus,
          shipperName: newShipper,
          awb: newAwb,
          trackingUrl: newTrackingUrl,
          deliveryDate: newDeliveryDate
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Order status retrieved successfully",
        order: updatedOrder,
        juraStatus: response.data
      });
    }

    return res.status(200).json({
      success: false,
      message: response.data?.message || "Failed to get status from Jura",
      order,
      juraResponse: response.data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking order status",
      error: error.response?.data || error.message
    });
  }
};

router.get("/check-jura-status/:orderId", checkJuraStatus);
router.get("/check-depoter-status/:orderId", checkJuraStatus);

module.exports = router;
