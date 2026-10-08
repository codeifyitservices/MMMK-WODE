const router = require("express").Router();

// controller
const {
  createCoupon,
  getAllCoupon,
  deleteCoupon,
  updateCoupon,
} = require("../Controller/admin-controllers/coupon/coupon.controller");

// routes
router.post("/create", createCoupon);
router.post("/update/:id", updateCoupon);
router.get("/get-all", getAllCoupon);
router.get("/delete/:id", deleteCoupon);

module.exports = router;
