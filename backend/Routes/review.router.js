const router = require("express").Router();

// controller
const {
  getAll,
  deleteReview,
  addAdminReview,
  updateAdminReview,
} = require("../Controller/user-controllers/review.controller");

// routes
router.get("/get-all", getAll);
router.post("/add-review", addAdminReview);
router.put("/update-review/:id", updateAdminReview);
router.post("/update-review/:id", updateAdminReview);
router.delete("/delete-review/:id", deleteReview);

module.exports = router;
