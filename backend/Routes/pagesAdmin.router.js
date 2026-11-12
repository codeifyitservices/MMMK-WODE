const express = require("express");
const router = express.Router();
const {
  getAllPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  generatePageSchema,
} = require("../Controller/admin-controllers/pagesAdmin.controller");

router.get(["/", ""], getAllPages);
router.post("/generate-schema", generatePageSchema);
router.get("/:id", getPageById);
router.post(["/", ""], createPage);
router.patch("/:id", updatePage);
router.put("/:id", updatePage);
router.delete("/:id", deletePage);

module.exports = router;

