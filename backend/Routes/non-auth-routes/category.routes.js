const router = require("express").Router();

// controller
const {
  getAllCategory,
  searchCategory,
} = require("../../Controller/non-auth-controllers/category.controller");

// routes
router.get("/all-category", getAllCategory);
router.get("/search", searchCategory);

module.exports = router;
