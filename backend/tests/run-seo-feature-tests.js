const assert = require("assert");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

const SeoSettings = require("../Models/SeoSettings");
const Page = require("../Models/Page");
const {
  generateGlobalSchema,
  generatePageSchema,
  normalizeJsonLd,
} = require("../utils/schemaGenerator");
const pagesAdminController = require("../Controller/admin-controllers/pagesAdmin.controller");
const seoAdminController = require("../Controller/admin-controllers/seoAdmin.controller");
const pagePublicController = require("../Controller/user-controllers/pagePublic.controller");

// Helper mock req/res
const createMockReqRes = (body = {}, params = {}, query = {}) => {
  const req = { body, params, query, admin: { _id: new mongoose.Types.ObjectId() } };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getData: () => responseData,
  };
};

async function runTests() {
  console.log("=========================================");
  console.log("   SEO & CMS PAGES FEATURE TEST SUITE   ");
  console.log("=========================================\n");

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}`);
      console.error(`       Error: ${err.message}`);
      failed++;
    }
  };

  // Connect to Database
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for integration tests.\n");
  } catch (err) {
    console.warn("Could not connect to live MongoDB, testing with in-memory validation:", err.message);
  }

  // --- 1. Global Schema Generation ---
  await test("1. Global Schema Generation creates valid Organization & WebSite JSON-LD", () => {
    const rawSchema = generateGlobalSchema({
      websiteName: "MMMK WODE",
      websiteUrl: "https://mmmk-wode.com",
      organizationName: "MMMK WODE Luxury",
      organizationDescription: "Handcrafted fine jewelry and luxury fashion",
      socialMediaLinks: [{ platform: "Instagram", url: "https://instagram.com/mmmk_wode" }],
    });

    const parsed = JSON.parse(rawSchema);
    assert(Array.isArray(parsed), "Schema should be an array of schemas");
    assert.strictEqual(parsed.length, 2, "Should contain Organization and WebSite schemas");
    assert.strictEqual(parsed[0]["@type"], "Organization");
    assert.strictEqual(parsed[1]["@type"], "WebSite");
    assert.strictEqual(parsed[0].name, "MMMK WODE Luxury");
    assert.strictEqual(parsed[1].url, "https://mmmk-wode.com");
  });

  // --- 2. JSON-LD Normalization & Syntax Validation ---
  await test("2. normalizeJsonLd accepts valid JSON and rejects corrupted strings", () => {
    const validJson = JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage" });
    const formatted = normalizeJsonLd(validJson);
    assert(formatted.includes('"@type": "WebPage"'), "Should format valid JSON");

    assert.throws(
      () => normalizeJsonLd('{ invalid_json: ', "Test schema"),
      /must be valid JSON/
    );
  });

  // --- 3. Page Schema Generation ---
  await test("3. Page Schema Generation builds valid WebPage schema with slug and meta", () => {
    const pageSchema = generatePageSchema(
      {
        title: "Terms and Conditions",
        slug: "terms-conditions",
        metaTitle: "Terms | MMMK WODE",
        metaDescription: "Our shopping rules and guarantees",
      },
      { websiteUrl: "https://mmmk-wode.com" }
    );

    const parsed = JSON.parse(pageSchema);
    assert.strictEqual(parsed["@context"], "https://schema.org");
    assert.strictEqual(parsed["@type"], "WebPage");
    assert.strictEqual(parsed.name, "Terms | MMMK WODE");
    assert.strictEqual(parsed.url, "https://mmmk-wode.com/terms-conditions");
  });

  // If DB connected, run live controller integration tests
  if (mongoose.connection.readyState === 1) {
    const testSlug = "auto-test-seo-page-" + Date.now();
    let createdPageId = null;

    // --- 4. Admin Page Creation ---
    await test("4. Admin creates a new custom page with auto slug and schema", async () => {
      const { req, res, getStatusCode, getData } = createMockReqRes({
        title: "Test Luxury Story",
        slug: testSlug,
        content: "<h2>Bespoke Perfumery</h2><p>Crafted in Paris and Dubai.</p>",
        status: "Published",
        footerPlacement: "footer_column_3",
        metaTitle: "Bespoke Perfumery | MMMK WODE",
        metaDescription: "Discover how our perfumes are blended.",
      });

      await pagesAdminController.createPage(req, res);
      assert.strictEqual(getStatusCode(), 201, "Expected HTTP 201 Created");
      const data = getData();
      assert(data.success, "Response should have success: true");
      assert(data.page, "Response should return created page");
      assert.strictEqual(data.page.slug, testSlug);
      createdPageId = data.page._id;
    });

    // --- 5. Slug Collision Prevention ---
    await test("5. Page creation rejects duplicate slug collision", async () => {
      const { req, res, getStatusCode, getData } = createMockReqRes({
        title: "Another Page",
        slug: testSlug, // Same slug
      });

      await pagesAdminController.createPage(req, res);
      assert.strictEqual(getStatusCode(), 400, "Expected HTTP 400 for duplicate slug");
      const data = getData();
      assert.strictEqual(data.success, false);
      assert(data.message.includes("already exists"));
    });

    // --- 6. Public Retrieval of Published Page ---
    await test("6. Public API fetches published page by slug", async () => {
      const { req, res, getStatusCode, getData } = createMockReqRes({}, { slug: testSlug });

      await pagePublicController.getPublicPageBySlug(req, res);
      assert.strictEqual(getStatusCode(), 200, "Expected HTTP 200 OK");
      const data = getData();
      assert(data.success);
      assert.strictEqual(data.page.slug, testSlug);
      assert.strictEqual(data.page.metaTitle, "Bespoke Perfumery | MMMK WODE");
    });

    // --- 7. Draft Protection ---
    await test("7. Draft pages are NOT accessible on public endpoint (404 returned)", async () => {
      // 1. Update page to Draft
      const updateReq = createMockReqRes({ status: "Draft" }, { id: createdPageId });
      await pagesAdminController.updatePage(updateReq.req, updateReq.res);
      assert.strictEqual(updateReq.getStatusCode(), 200);

      // 2. Try fetching from public endpoint
      const pubReq = createMockReqRes({}, { slug: testSlug });
      await pagePublicController.getPublicPageBySlug(pubReq.req, pubReq.res);
      assert.strictEqual(pubReq.getStatusCode(), 404, "Draft page must return 404 to public users");
    });

    // --- 8. Footer Grouping ---
    await test("8. Public footer endpoint groups published pages by column", async () => {
      // Restore to Published
      const updateReq = createMockReqRes({ status: "Published" }, { id: createdPageId });
      await pagesAdminController.updatePage(updateReq.req, updateReq.res);

      const { req, res, getStatusCode, getData } = createMockReqRes();
      await pagePublicController.getPublicFooterPages(req, res);
      assert.strictEqual(getStatusCode(), 200);
      const data = getData();
      assert(data.success);
      assert(data.footerPages.column3.some((p) => p.slug === testSlug), "Page should be in column3");
    });

    // --- 9. Global SEO Settings API ---
    await test("9. Global SEO settings can be retrieved and updated via Admin API", async () => {
      const getReq = createMockReqRes();
      await seoAdminController.getSeoSettings(getReq.req, getReq.res);
      assert.strictEqual(getReq.getStatusCode(), 200);

      const patchReq = createMockReqRes({
        organizationName: "MMMK WODE Haute Parfumerie",
        socialMediaLinks: [{ platform: "Instagram", url: "https://instagram.com/mmmk_wode" }],
      });
      await seoAdminController.updateSeoSettings(patchReq.req, patchReq.res);
      assert.strictEqual(patchReq.getStatusCode(), 200);
      assert.strictEqual(patchReq.getData().settings.organizationName, "MMMK WODE Haute Parfumerie");
    });

    // --- 10. Clean up Test Page ---
    await test("10. Admin deletes test page and verifies removal", async () => {
      const delReq = createMockReqRes({}, { id: createdPageId });
      await pagesAdminController.deletePage(delReq.req, delReq.res);
      assert.strictEqual(delReq.getStatusCode(), 200);

      const verifyDoc = await Page.findById(createdPageId);
      assert.strictEqual(verifyDoc, null, "Page document should be completely removed from MongoDB");
    });
  }

  console.log("\n=========================================");
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("=========================================\n");

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

