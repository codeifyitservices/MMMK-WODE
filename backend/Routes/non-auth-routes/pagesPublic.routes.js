const express = require("express");
const router = express.Router();
const {
  getPublicPageBySlug,
  getPublicFooterPages,
} = require("../../Controller/user-controllers/pagePublic.controller");

router.get("/footer", getPublicFooterPages);
router.get("/slug/:slug", getPublicPageBySlug);

module.exports = router;

