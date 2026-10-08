const express = require("express");
const router = express.Router();

const {
  addWishList,
  removeWishList,
  getWishLists,
} = require("../../Controller/user-controllers/wishList.controller.js");

router.post("/add", addWishList);
router.post("/remove", removeWishList);
router.get("/:id", getWishLists);

module.exports = router;
