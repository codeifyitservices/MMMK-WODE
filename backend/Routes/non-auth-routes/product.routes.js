const router = require("express").Router();

// controller
const {
  getAllProducts,
  getBrands,
  getSingleProduct,
  getRandomProducts,
  getAllProductsWithFilters,
  getRelatedProducts,
  getProductSkus,
  getHomePageBottomSectionList,
  searchProducts,
  recordProductView,
} = require("../../Controller/non-auth-controllers/products.controller");

// routes
router.post("/view/:id", recordProductView);
router.get("/search", searchProducts);
router.get("/all-products", getAllProducts);
router.get("/related-products/:productId", getRelatedProducts);
router.get("/all-products-with-filters", getAllProductsWithFilters);
router.get("/all-brands", getBrands);
router.get("/get-single/:id", getSingleProduct);
router.get("/get-product-skus/:id", getProductSkus);
router.get("/get-random", getRandomProducts);
router.get("/home-bootom-section", getHomePageBottomSectionList);

module.exports = router;
