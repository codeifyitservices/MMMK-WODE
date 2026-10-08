const router = require("express").Router();
const {
  postTranslate,
} = require("../../Controller/non-auth-controllers/translate.controller");

router.post("/", postTranslate);

module.exports = router;
