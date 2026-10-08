const express = require("express");
const router = express.Router();

// controllers
const {
  addCartItem,
  getCartItem,
  removeCartItem,
  setCartItems,
  saveForLater,
} = require("../../Controller/user-controllers/cart.controller");

// routes
router.post("/add-item", addCartItem);
router.get("/get-cart-item", getCartItem);
router.post("/set-cart-items", setCartItems);
router.get("/remove-cart-item/:id", removeCartItem);
router.post("/save-for-later/:id", saveForLater);

module.exports = router;
