const express = require("express");
const router = express.Router();
const {
  getSeoSettings,
  updateSeoSettings,
  generateSeoSchema,
} = require("../Controller/admin-controllers/seoAdmin.controller");

router.get(["/", ""], getSeoSettings);
router.patch(["/", ""], updateSeoSettings);
router.put(["/", ""], updateSeoSettings);
router.post("/update", updateSeoSettings);
router.post("/generate-schema", generateSeoSchema);

module.exports = router;

