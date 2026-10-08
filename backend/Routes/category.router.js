const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");

const {
  addCategory,
  editCategory,
  deleteCategory,
  getCategory,
  getAllCategory,
  reorderCategories,
} = require("../Controller/admin-controllers/category/category.controller");

router.post("/add", upload.single("image"), addCategory);
router.post("/get/:id", getCategory);
router.get("/get-all", getAllCategory);
router.post("/edit/:id", upload.single("image"), editCategory);
router.get("/delete/:id", deleteCategory);
router.post("/reorder", reorderCategories); // ← new

module.exports = router;
