const router = require("express").Router();

// controller
const {
  getAllFilters,
  addFilters,
  updateFilters,
  deleteFilter,
} = require("../Controller/admin-controllers/filter/filter.controller");

// routes
router.get("/get-all", getAllFilters);
router.post("/create", addFilters);
router.post("/update/:id", updateFilters);
router.get("/delete/:id", deleteFilter);

module.exports = router;
