const router = require("express").Router();

// controller
const {
  createSupport,
  addReplyToSupport,
  deleteSupport,
  getAllSupports,
} = require("../Controller/admin-controllers/support/support.controller");

// routes
router.get("/get-all", getAllSupports);
router.get("/delete/:id", deleteSupport);
router.post("/create", createSupport);
router.post("/add-reply/:id", addReplyToSupport);

module.exports = router;
