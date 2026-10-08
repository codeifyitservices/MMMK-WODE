const router = require("express").Router();
const upload = require("../utils/multer");

// controller
const {
  updateBanner,
  getBanner,
} = require("../Controller/admin-controllers/editPage/home/home.controller");

const {
  updateSection2,
  getSection2,
} = require("../Controller/admin-controllers/editPage/home/section2.controller");

const {
  updateSection8,
  getSection8,
} = require("../Controller/admin-controllers/editPage/home/section8.controller");

const {
  updateSection9,
  getSection9,
} = require("../Controller/admin-controllers/editPage/home/section9.controller");

const {
  updateSection11,
  getSection11,
} = require("../Controller/admin-controllers/editPage/home/section11.controller");

const {
  updateSection12,
  getSection12,
} = require("../Controller/admin-controllers/editPage/home/section12.controller");

const {
  updateFooter,
  getFooter,
} = require("../Controller/admin-controllers/editPage/footer/footer.controller");

const {
  updateSectionProducts,
  getSectionProducts,
} = require("../Controller/admin-controllers/editPage/home/sectionProducts.controller");

const {
  updateTopStrip,
  getTopStrip: getAdminTopStrip,
} = require("../Controller/admin-controllers/editPage/topStrip.controller");


// ############################################ ROUTES #######################################################

// routes for home banner
router.post("/home/banner/update", upload.single("image"), updateBanner);
router.get("/home/banner/get", getBanner);

// routes for section2
router.post(
  "/home/section2/update",
  upload.fields([
    { name: "leftImage", maxCount: 1 },
    { name: "rightImage", maxCount: 1 },
  ]),
  updateSection2
);
router.get("/home/section2/get", getSection2);

// routes for section 8
router.post(
  "/home/section8/update",
  upload.fields([
    { name: "leftImage", maxCount: 1 },
    { name: "rightImage", maxCount: 1 },
  ]),
  updateSection8
);
router.get("/home/section8/get", getSection8);

// routes from section 9
router.post("/home/section9/update", upload.single("image"), updateSection9);
router.get("/home/section9/get", getSection9);

// routes from section 11
router.post("/home/section11/update", upload.single("image"), updateSection11);
router.get("/home/section11/get", getSection11);

// routes from section 12
router.post(
  "/home/section12/update",
  upload.array("videos", 12),
  updateSection12
);
router.get("/home/section12/get", getSection12);

// routes from section products
router.post("/home/section-products/update", updateSectionProducts);
router.get("/home/section-products/get", getSectionProducts);

// ---------------------- Footer routes --------------------------
router.post("/footer/update", upload.single("image"), updateFooter);
router.get("/footer/get", upload.single("image"), getFooter);

// ---------------------- Top Strip routes -----------------------
router.post("/top-strip/update", updateTopStrip);
router.get("/top-strip/get", getAdminTopStrip);

module.exports = router;
