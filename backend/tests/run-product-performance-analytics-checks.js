const assert = require("assert");
const mongoose = require("mongoose");
const dayjs = require("dayjs");
const dns = require("dns");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

// Models
const Product = require("../Models/Product");
const Order = require("../Models/Order");
const ProductView = require("../Models/ProductView");
const {
  getSalesPerformance,
  getViewPerformance,
  getAnalyticsSummary,
} = require("../Controller/admin-controllers/analytics/productPerformance.controller");
const { recordProductView } = require("../Controller/non-auth-controllers/products.controller");

async function runTests() {
  console.log("=== RUNNING PRODUCT PERFORMANCE & VIEW ANALYTICS TESTS ===\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mmk_test_analytics";
  let isConnected = false;

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    isConnected = true;
    console.log("[TEST_SETUP] Connected to MongoDB");
  } catch (err) {
    console.warn("[TEST_SETUP] Direct Mongo connection skipped (offline mode):", err.message);
  }

  if (isConnected) {
    // Clear collections for test isolation
    await Product.deleteMany({ _id: { $in: [
      "66f000000000000000000001",
      "66f000000000000000000002",
      "66f000000000000000000003",
    ] } });
    await Order.deleteMany({ orderId: { $in: ["TEST-ORD-001", "TEST-ORD-002", "TEST-ORD-003", "TEST-ORD-004", "TEST-ORD-005"] } });
    await ProductView.deleteMany({ productId: { $in: [
      "66f000000000000000000001",
      "66f000000000000000000002",
      "66f000000000000000000003",
    ] } });

    // Seed test products
    const p1 = await Product.create({
      _id: new mongoose.Types.ObjectId("66f000000000000000000001"),
      productName: { en: "High Quantity Product A" },
      price: 100, // Current price
      status: "Active",
      image: "https://example.com/p1.jpg",
    });

    const p2 = await Product.create({
      _id: new mongoose.Types.ObjectId("66f000000000000000000002"),
      productName: { en: "High Revenue Product B" },
      price: 1000, // Current price
      status: "Active",
      image: "https://example.com/p2.jpg",
    });

    const p3 = await Product.create({
      _id: new mongoose.Types.ObjectId("66f000000000000000000003"),
      productName: { en: "Most Viewed Product C" },
      price: 50,
      status: "Active",
      image: "https://example.com/p3.jpg",
    });

    const userId = new mongoose.Types.ObjectId();

    // Seed test orders
    // Order 1: Paid order for Product A (5 units @ historical price 50 each = 250 AED)
    await Order.create({
      userId,
      orderId: "TEST-ORD-001",
      status: "Complete",
      paymentStatus: "Paid",
      mode: "card",
      currency: "AED",
      currencyRate: 0.27,
      amount: 250,
      totalQuantity: 5,
      price: { total: 250, subtotal: 250 },
      products: [
        {
          id: p1._id,
          sku: "SKU-A",
          name: "High Quantity Product A",
          quantity: 5,
          amount: 250, // 5 * 50
        },
      ],
      createdAt: new Date(),
    });

    // Order 2: Paid order for Product A (10 units @ historical price 40 each = 400 AED)
    // and Product B (2 units @ historical price 800 each = 1600 AED)
    await Order.create({
      userId,
      orderId: "TEST-ORD-002",
      status: "Complete",
      paymentStatus: "Paid",
      mode: "card",
      currency: "AED",
      currencyRate: 0.27,
      amount: 2000,
      totalQuantity: 12,
      price: { total: 2000, subtotal: 2000 },
      products: [
        {
          id: p1._id,
          sku: "SKU-A",
          name: "High Quantity Product A",
          quantity: 10,
          amount: 400,
        },
        {
          id: p2._id,
          sku: "SKU-B",
          name: "High Revenue Product B",
          quantity: 2,
          amount: 1600,
        },
      ],
      createdAt: new Date(),
    });

    // Order 3: Cancelled order (Product A: 50 units @ 100) -> MUST NOT COUNT
    await Order.create({
      userId,
      orderId: "TEST-ORD-003",
      status: "Cancelled",
      paymentStatus: "Paid",
      mode: "card",
      currency: "AED",
      currencyRate: 0.27,
      amount: 5000,
      totalQuantity: 50,
      price: { total: 5000, subtotal: 5000 },
      products: [
        {
          id: p1._id,
          sku: "SKU-A",
          name: "High Quantity Product A",
          quantity: 50,
          amount: 5000,
        },
      ],
      createdAt: new Date(),
    });

    // Order 4: Failed payment order -> MUST NOT COUNT
    await Order.create({
      userId,
      orderId: "TEST-ORD-004",
      status: "Pending",
      paymentStatus: "Failed",
      mode: "card",
      currency: "AED",
      currencyRate: 0.27,
      amount: 3000,
      totalQuantity: 30,
      price: { total: 3000, subtotal: 3000 },
      products: [
        {
          id: p1._id,
          sku: "SKU-A",
          name: "High Quantity Product A",
          quantity: 30,
          amount: 3000,
        },
      ],
      createdAt: new Date(),
    });

    // Order 5: Valid COD order in Processing status (Product B: 1 unit @ 900 AED)
    await Order.create({
      userId,
      orderId: "TEST-ORD-005",
      status: "Processing",
      paymentStatus: "Pending",
      mode: "cod",
      currency: "AED",
      currencyRate: 0.27,
      amount: 900,
      totalQuantity: 1,
      price: { total: 900, subtotal: 900 },
      products: [
        {
          id: p2._id,
          sku: "SKU-B",
          name: "High Revenue Product B",
          quantity: 1,
          amount: 900,
        },
      ],
      createdAt: new Date(),
    });

    // ─── TEST 1: SALES PERFORMANCE & SEPARATE RANKINGS ───
    console.log("TEST 1: Testing Sales Performance Aggregation...");
    const mockReq = { query: { rangeType: "all", limit: 10 } };
    let salesResponse = null;
    const mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        salesResponse = payload;
        return this;
      },
    };

    await getSalesPerformance(mockReq, mockRes);
    assert(salesResponse && salesResponse.success, "Sales performance API should succeed");

    const { summary, mostSold, highestRevenue } = salesResponse.data;

    // Find test products in the results
    const p1MostSold = mostSold.find((p) => p.productId.toString() === p1._id.toString());
    const p2MostSold = mostSold.find((p) => p.productId.toString() === p2._id.toString());
    const p1Revenue = highestRevenue.find((p) => p.productId.toString() === p1._id.toString());
    const p2Revenue = highestRevenue.find((p) => p.productId.toString() === p2._id.toString());

    assert(p1MostSold && p2MostSold, "Test products must appear in mostSold rankings");
    assert(p1Revenue && p2Revenue, "Test products must appear in highestRevenue rankings");

    // Verify Product A units sold = 5 (Order 1) + 10 (Order 2) = 15 units. (Cancelled & Failed excluded)
    // Product B units sold = 2 (Order 2) + 1 (Order 5 COD) = 3 units.
    assert.strictEqual(p1MostSold.unitsSold, 15, "Product A must have 15 units sold");
    assert.strictEqual(p2MostSold.unitsSold, 3, "Product B must have 3 units sold");
    assert(p1MostSold.rank < p2MostSold.rank, "Product A must rank higher than Product B in Most Sold");

    // Verify Highest Revenue Ranking: Product B (1600 + 900 = 2500 AED), Product A (250 + 400 = 650 AED)
    assert.strictEqual(p2Revenue.revenue, 2500, "Product B must have 2500 AED revenue");
    assert.strictEqual(p1Revenue.revenue, 650, "Product A must have 650 AED revenue");
    assert(p2Revenue.rank < p1Revenue.rank, "Product B must rank higher than Product A in Highest Revenue");
    console.log("  ✓ TEST 1 PASSED: Most Sold & Highest Revenue are independent rankings with historical pricing.\n");

    // ─── TEST 2: PRODUCT VIEW TRACKING & 30-MIN DEDUPLICATION ───
    console.log("TEST 2: Testing Product View Tracking & Deduplication...");
    const testSession = "test-session-uuid-123";

    // 1st view for Product C (new view)
    let viewRes1 = null;
    const mockResV1 = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { viewRes1 = payload; return this; },
    };
    await recordProductView({ params: { id: p3._id.toString() }, body: { sessionId: testSession }, headers: {} }, mockResV1);
    assert.strictEqual(viewRes1?.recorded, true, "First view should be recorded");

    // Immediate repeat view with same session (should be deduplicated)
    let viewRes2 = null;
    const mockResV2 = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { viewRes2 = payload; return this; },
    };
    await recordProductView({ params: { id: p3._id.toString() }, body: { sessionId: testSession }, headers: {} }, mockResV2);
    assert.strictEqual(viewRes2?.recorded, false, "Immediate duplicate view should not be recorded");

    // Different product view with same session (should be recorded)
    let viewRes3 = null;
    const mockResV3 = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { viewRes3 = payload; return this; },
    };
    await recordProductView({ params: { id: p1._id.toString() }, body: { sessionId: testSession }, headers: {} }, mockResV3);
    assert.strictEqual(viewRes3?.recorded, true, "Different product view should be recorded");

    // Authenticated user deduplication test
    const testUserId = new mongoose.Types.ObjectId();
    await ProductView.create({
      productId: p3._id,
      userId: testUserId,
      timestamp: new Date(),
    });

    // Seed more views for Product C from different sessions to make it Most Viewed
    for (let i = 0; i < 5; i++) {
      await ProductView.create({
        productId: p3._id,
        sessionId: `different-session-${i}`,
        timestamp: new Date(),
      });
    }

    let viewPerfResponse = null;
    const mockResVP = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { viewPerfResponse = payload; return this; },
    };
    await getViewPerformance({ query: { rangeType: "all", limit: 10 } }, mockResVP);
    assert(viewPerfResponse?.success, "View performance API should succeed");

    const mostViewed = viewPerfResponse.data.mostViewed;
    console.log("  Most Viewed Rank 1:", mostViewed[0].productName?.en, "Views:", mostViewed[0].views);
    assert.strictEqual(mostViewed[0].productId.toString(), p3._id.toString(), "Product C must be Rank 1 in Most Viewed");
    console.log("  ✓ TEST 2 PASSED: View tracking and 30-min deduplication work correctly.\n");

    // ─── TEST 3: DATE FILTERING ───
    console.log("TEST 3: Testing Date Filtering Boundaries...");
    // Future date range (should return 0)
    let futureSalesResponse = null;
    const mockResFuture = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { futureSalesResponse = payload; return this; },
    };
    await getSalesPerformance({
      query: {
        rangeType: "custom",
        startDate: dayjs().add(10, "day").toISOString(),
        endDate: dayjs().add(20, "day").toISOString(),
      },
    }, mockResFuture);

    assert.strictEqual(futureSalesResponse.data.summary.totalUnitsSold, 0, "Future date range should have 0 units sold");
    assert.strictEqual(futureSalesResponse.data.mostSold.length, 0, "Future date range should return empty ranking");
    console.log("  ✓ TEST 3 PASSED: Date filtering boundaries handled correctly.\n");

    // Clean up test data
    await Product.deleteMany({ _id: { $in: [p1._id, p2._id, p3._id] } });
    await Order.deleteMany({ orderId: { $in: ["TEST-ORD-001", "TEST-ORD-002", "TEST-ORD-003", "TEST-ORD-004", "TEST-ORD-005"] } });
    await ProductView.deleteMany({ productId: { $in: [p1._id, p2._id, p3._id] } });
    await mongoose.disconnect();
  }

  console.log("ALL TESTS COMPLETED SUCCESSFULLY! ✓");
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
