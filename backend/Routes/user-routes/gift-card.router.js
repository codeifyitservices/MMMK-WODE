const express = require("express");
const {
  addGiftCard,
  createGiftCard,
  getCreatedGiftCards,
  shareGiftCard,
} = require("../../Controller/user-controllers/gift-card.controller");
const router = express.Router();

router.post("/add-gift-card", addGiftCard);
router.post("/create-gift-card", createGiftCard);
router.get("/created-gift-cards", getCreatedGiftCards);
router.post("/share/:giftCardId", shareGiftCard);

module.exports = router;
