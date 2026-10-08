const router = require("express").Router();

// controller
const {
  getBanner,
  getSection2,
  getSectionProducts,
  getSection8,
  getSection9,
  getSection11,
  getSection12,
  getFooter,
} = require("../../Controller/non-auth-controllers/editPage/home.controller");

const {
  getTopStrip,
} = require("../../Controller/non-auth-controllers/editPage/topStrip.controller");

// ################ HOME ##############

// section product routes
router.get("/home/section-products", getSectionProducts);
router.get("/home/banner", getBanner);
router.get("/home/section2", getSection2);
router.get("/home/section8", getSection8);
router.get("/home/section9", getSection9);
router.get("/home/section11", getSection11);
router.get("/home/section12", getSection12);
router.get("/home/getFooter", getFooter);

// Top Strip route
router.get("/top-strip/get", getTopStrip);

module.exports = router;
