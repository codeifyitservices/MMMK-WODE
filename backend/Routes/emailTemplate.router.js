const express = require("express");
const router = express.Router();
const {
  getEmailTemplate,
  updateEmailTemplate,
  sendTestEmail,
} = require("../Controller/admin-controllers/emailTemplate/emailTemplate.controller");

// GET  /api/v1/admin/emailTemplate/get    — fetch current template settings
router.get("/get", getEmailTemplate);

// POST /api/v1/admin/emailTemplate/update — save subject & customMessage
router.post("/update", updateEmailTemplate);

// POST /api/v1/admin/emailTemplate/send-test — send a test preview email
router.post("/send-test", sendTestEmail);

module.exports = router;
