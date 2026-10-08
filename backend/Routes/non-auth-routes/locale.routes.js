const router = require('express').Router();
const { detectLocale } = require('../../Controller/non-auth-controllers/locale.controller');

router.get('/locale-detect', detectLocale);

module.exports = router;
