const assert = require("node:assert/strict");
const { sanitizeSlug, generateUniqueSlug } = require("../utils/slugify");
const {
  generateCategorySchema,
  generateProductSchema,
} = require("../utils/schemaGenerator");

async function runTests() {
  console.log("Running Auto SEO & Schema Generation Unit Tests...\n");

  // Test 1: Slug sanitization
  console.log("1. Testing sanitizeSlug...");
  assert.equal(sanitizeSlug("Fragrance & Perfumes!"), "fragrance-perfumes");
  assert.equal(sanitizeSlug("White Tahara (Silky Musk)"), "white-tahara-silky-musk");
  assert.equal(sanitizeSlug("   MMM (100 ml)   "), "mmm-100-ml");
  console.log("   ✓ sanitizeSlug passed");

  // Test 2: Unique slug generation with collision handling
  console.log("2. Testing generateUniqueSlug...");
  const mockExistingSlugs = new Set(["fragrance", "fragrance-1"]);
  const mockModel = {
    exists: async (query) => (mockExistingSlugs.has(query.slug) ? { _id: "existing-id" } : null),
  };
  const uniqueSlug = await generateUniqueSlug(mockModel, "Fragrance");
  assert.equal(uniqueSlug, "fragrance-2");
  console.log("   ✓ generateUniqueSlug passed (resolved to fragrance-2)");

  // Test 3: Category schema auto-generation
  console.log("3. Testing Category Schema auto-generation...");
  const catSchemaJson = generateCategorySchema({
    name: { en: "Fragrance" },
    slug: "fragrance",
    image: "fragrance-banner.jpg",
  });
  const catSchema = JSON.parse(catSchemaJson);
  assert.equal(catSchema["@context"], "https://schema.org");
  assert.equal(catSchema["@type"], "CollectionPage");
  assert.equal(catSchema.name, "Fragrance");
  assert.ok(catSchema.description.includes("Fragrance"));
  assert.ok(catSchema.url.includes("category=fragrance"));
  console.log("   ✓ Category schema auto-generation passed");

  // Test 4: Product schema auto-generation
  console.log("4. Testing Product Schema auto-generation...");
  const prodSchemaJson = generateProductSchema({
    productName: { en: "White Tahara Silky Musk" },
    productDescription: { en: "An opulent, creamy musk fragrance oil." },
    slug: "white-tahara-silky-musk",
    price: 350,
    brand: "MMMK WODE",
    image: "tahara.jpg",
    status: "Active",
  });
  const prodSchema = JSON.parse(prodSchemaJson);
  assert.equal(prodSchema["@context"], "https://schema.org");
  assert.equal(prodSchema["@type"], "Product");
  assert.equal(prodSchema.name, "White Tahara Silky Musk");
  assert.equal(prodSchema.offers.price, 350);
  assert.equal(prodSchema.offers.priceCurrency, "AED");
  assert.equal(prodSchema.offers.availability, "https://schema.org/InStock");
  assert.ok(prodSchema.url.includes("product-details/white-tahara-silky-musk"));
  console.log("   ✓ Product schema auto-generation passed");

  console.log("\nAll Auto SEO & Schema Generation tests passed successfully!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
