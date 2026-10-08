const router = require("express").Router();

// controller
const {
  getAll,
  deleteReview,
} = require("../Controller/user-controllers/review.controller");

// routes
router.get("/get-all", getAll);
router.delete("/delete-review/:id", deleteReview);

module.exports = router;
