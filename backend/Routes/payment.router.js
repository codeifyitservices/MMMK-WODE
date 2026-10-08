const router = require("express").Router();

// controller
const {
  createPayment,
  getAllPayments,
  deletePayment,
} = require("../Controller/admin-controllers/payment/payment.controller");

// routes
router.post("/create", createPayment);
router.get("/get-all", getAllPayments);
router.get("/delete/:id", deletePayment);

module.exports = router;
