const router = require("express").Router();

// controllers
const {
  addGiftCard,
  updateGiftCard,
  deleteGiftCard,
  getActive,
  getAll,
} = require("../Controller/admin-controllers/giftcard/giftCard.controller");

// routes
router.post("/add", addGiftCard);
router.post("/update/:id", updateGiftCard);
router.post("/delete/:id", deleteGiftCard);
router.get("/get-all", getAll);
router.get("/get-active", getActive);

module.exports = router;
