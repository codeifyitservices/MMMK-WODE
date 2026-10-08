const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");

// controller
const {
  create,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
} = require("../Controller/admin-controllers/product/product.controller");

// routes
router.post(
  "/create",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  create
);
router.get("/get-all", getAllProducts);
router.get("/get-single/:id", getSingleProduct);
router.post(
  "/update/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  updateProduct
);
router.post("/delete/:id", deleteProduct);
router.post("/reorder", reorderProducts);

module.exports = router;
