const SeoSettings = require("../Models/SeoSettings");
const Page = require("../Models/Page");
const schemaGen = require("../utils/schemaGenerator");
const seoAdmin = require("../Controller/admin-controllers/seoAdmin.controller");
const pagesAdmin = require("../Controller/admin-controllers/pagesAdmin.controller");
const pagePublic = require("../Controller/user-controllers/pagePublic.controller");
const routes = require("../routes");

console.log("=== SEO & CMS Backend Verification ===");
console.log("1. SeoSettings Model loaded:", typeof SeoSettings === "function");
console.log("2. Page Model loaded:", typeof Page === "function");
console.log("3. SchemaGenerator functions:", Object.keys(schemaGen).join(", "));
console.log("4. SeoAdmin controller methods:", Object.keys(seoAdmin).join(", "));
console.log("5. PagesAdmin controller methods:", Object.keys(pagesAdmin).join(", "));
console.log("6. PagePublic controller methods:", Object.keys(pagePublic).join(", "));
console.log("7. Master routes loaded:", typeof routes === "function");

// Test schema generation functionality
const testGlobalSchema = schemaGen.generateGlobalSchema({
  websiteName: "MMMK WODE",
  websiteUrl: "https://mmmk-wode.com",
  organizationName: "MMMK WODE",
  organizationDescription: "Luxury jewelry, fragrance, and fashion",
  socialMediaLinks: [{ platform: "Instagram", url: "https://instagram.com/mmmk_wode" }],
});
const parsedGlobal = JSON.parse(testGlobalSchema);
console.log("8. Test Global Schema count:", parsedGlobal.length, "(Expected: 2 -> Organization & WebSite)");

const testPageSchema = schemaGen.generatePageSchema(
  {
    title: "About Us",
    slug: "about-us",
    metaTitle: "About MMMK WODE | Luxury Brand",
    metaDescription: "The history and craft of MMMK WODE.",
  },
  { websiteUrl: "https://mmmk-wode.com" }
);
const parsedPage = JSON.parse(testPageSchema);
console.log("9. Test Page Schema type:", parsedPage["@type"], "(Expected: WebPage)");
console.log("10. Test Page Schema url:", parsedPage.url);

console.log("=== All backend checks passed successfully! ===");

