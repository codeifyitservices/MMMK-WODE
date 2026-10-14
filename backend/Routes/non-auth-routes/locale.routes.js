const router = require('express').Router();
const { detectLocale } = require('../../Controller/non-auth-controllers/locale.controller');
const { recordTrafficVisit } = require('../../Controller/admin-controllers/analytics/productPerformance.controller');

router.get('/locale-detect', detectLocale);
router.post('/traffic-record', recordTrafficVisit);

module.exports = router;
