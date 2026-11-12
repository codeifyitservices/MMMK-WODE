const express = require("express");
const router = express.Router();
const {
  getPublicSeoSettings,
} = require("../../Controller/user-controllers/pagePublic.controller");

router.get("/", getPublicSeoSettings);

module.exports = router;

