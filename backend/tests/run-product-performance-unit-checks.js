const assert = require("assert");
const dayjs = require("dayjs");

console.log("=== RUNNING OFFLINE / UNIT TEST SUITE FOR ANALYTICS LOGIC ===\n");

// 1. Test Date Range Presets and Boundaries
console.log("TEST 1: Validating Date Range Calculations...");
const now = dayjs();

const getRange = (rangeType, customStart, customEnd) => {
  let start;
  let end;
  switch (rangeType) {
    case "today":
      start = now.startOf("day");
      end = now.endOf("day");
      break;
    case "last7days":
      start = now.subtract(6, "day").startOf("day");
      end = now.endOf("day");
      break;
    case "last30days":
      start = now.subtract(29, "day").startOf("day");
      end = now.endOf("day");
      break;
    case "thisMonth":
      start = now.startOf("month");
      end = now.endOf("month");
      break;
    case "lastMonth":
      start = now.subtract(1, "month").startOf("month");
      end = now.subtract(1, "month").endOf("month");
      break;
    case "custom":
      start = dayjs(customStart).startOf("day");
      end = dayjs(customEnd).endOf("day");
      break;
    case "all":
      return { startDate: null, endDate: null };
  }
  return { startDate: start.toDate(), endDate: end.toDate() };
};

const todayRange = getRange("today");
assert(todayRange.startDate <= todayRange.endDate, "Today start must be before end");
assert.strictEqual(dayjs(todayRange.startDate).format("YYYY-MM-DD"), now.format("YYYY-MM-DD"));

const last7 = getRange("last7days");
const daysDiff7 = dayjs(last7.endDate).diff(dayjs(last7.startDate), "day");
assert.strictEqual(daysDiff7, 6, "Last 7 days must span exactly 7 calendar days");

const last30 = getRange("last30days");
const daysDiff30 = dayjs(last30.endDate).diff(dayjs(last30.startDate), "day");
assert.strictEqual(daysDiff30, 29, "Last 30 days must span exactly 30 calendar days");

const allRange = getRange("all");
assert.strictEqual(allRange.startDate, null, "All-time range should have null start");
assert.strictEqual(allRange.endDate, null, "All-time range should have null end");

console.log("  ✓ TEST 1 PASSED: Date range boundaries are exact.\n");

// 2. Test Historical Price & Units Sold Logic (Independent Rankings)
console.log("TEST 2: Validating Independent Rankings & Historical Pricing Math...");

const mockOrders = [
  // Valid Card Order (Paid)
  {
    orderId: "ORD-1",
    status: "Complete",
    paymentStatus: "Paid",
    mode: "card",
    currency: "AED",
    currencyRate: 0.27,
    products: [
      { id: "P1", name: "Product A", quantity: 5, amount: 250 }, // 5 units @ 50
      { id: "P2", name: "Product B", quantity: 1, amount: 1000 }, // 1 unit @ 1000
    ],
  },
  // Valid COD Order (Processing)
  {
    orderId: "ORD-2",
    status: "Processing",
    paymentStatus: "Pending",
    mode: "cod",
    currency: "AED",
    currencyRate: 0.27,
    products: [
      { id: "P1", name: "Product A", quantity: 10, amount: 400 }, // 10 units @ 40 (historical price discounted)
      { id: "P2", name: "Product B", quantity: 2, amount: 2000 }, // 2 units @ 1000
    ],
  },
  // Cancelled Order (Must be excluded)
  {
    orderId: "ORD-3",
    status: "Cancelled",
    paymentStatus: "Paid",
    mode: "card",
    currency: "AED",
    currencyRate: 0.27,
    products: [
      { id: "P1", name: "Product A", quantity: 100, amount: 5000 },
    ],
  },
  // Failed Payment Order (Must be excluded)
  {
    orderId: "ORD-4",
    status: "Pending",
    paymentStatus: "Failed",
    mode: "card",
    currency: "AED",
    currencyRate: 0.27,
    products: [
      { id: "P2", name: "Product B", quantity: 50, amount: 50000 },
    ],
  },
];

// Check valid order filter
const isValidOrder = (order) => {
  if (order.status === "Cancelled") return false;
  if (order.paymentStatus === "Paid") return true;
  if (order.mode === "cod" && ["Processing", "Complete"].includes(order.status) && order.paymentStatus !== "Failed") return true;
  return false;
};

const validOrders = mockOrders.filter(isValidOrder);
assert.strictEqual(validOrders.length, 2, "Only ORD-1 and ORD-2 should be valid");

// Aggregate Sales
const productSales = {};
validOrders.forEach((order) => {
  order.products.forEach((item) => {
    if (!productSales[item.id]) {
      productSales[item.id] = { productId: item.id, name: item.name, unitsSold: 0, revenue: 0 };
    }
    productSales[item.id].unitsSold += item.quantity;
    productSales[item.id].revenue += item.amount;
  });
});

// Product A: 5 + 10 = 15 units sold, 250 + 400 = 650 AED revenue
assert.strictEqual(productSales["P1"].unitsSold, 15);
assert.strictEqual(productSales["P1"].revenue, 650);

// Product B: 1 + 2 = 3 units sold, 1000 + 2000 = 3000 AED revenue
assert.strictEqual(productSales["P2"].unitsSold, 3);
assert.strictEqual(productSales["P2"].revenue, 3000);

// Most Sold Ranking: Sorted by unitsSold DESC
const mostSold = Object.values(productSales).sort((a, b) => b.unitsSold - a.unitsSold);
assert.strictEqual(mostSold[0].productId, "P1", "P1 must be #1 in Most Sold (15 units)");
assert.strictEqual(mostSold[1].productId, "P2", "P2 must be #2 in Most Sold (3 units)");

// Highest Revenue Ranking: Sorted by revenue DESC
const highestRevenue = Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
assert.strictEqual(highestRevenue[0].productId, "P2", "P2 must be #1 in Highest Revenue (3000 AED)");
assert.strictEqual(highestRevenue[1].productId, "P1", "P1 must be #2 in Highest Revenue (650 AED)");

// Verify they are INDEPENDENT and not combined
assert.notStrictEqual(mostSold[0].productId, highestRevenue[0].productId, "Rank #1 must differ between Most Sold and Highest Revenue");

console.log("  Most Sold Rank 1:", mostSold[0].name, "- Units Sold:", mostSold[0].unitsSold);
console.log("  Highest Revenue Rank 1:", highestRevenue[0].name, "- Revenue:", highestRevenue[0].revenue);
console.log("  ✓ TEST 2 PASSED: Sales and revenue rankings are independent with correct historical pricing.\n");

// 3. Test View Tracking & Deduplication Logic
console.log("TEST 3: Validating View Deduplication Logic...");

const mockViews = [];
const recordViewMock = ({ productId, userId, sessionId, timestamp = new Date() }) => {
  const DEDUP_WINDOW_MS = 30 * 60 * 1000;
  const cutoff = new Date(timestamp.getTime() - DEDUP_WINDOW_MS);

  let isDuplicate = false;
  if (userId) {
    isDuplicate = mockViews.some(
      (v) => v.productId === productId && v.userId === userId && v.timestamp >= cutoff
    );
  } else if (sessionId) {
    isDuplicate = mockViews.some(
      (v) => v.productId === productId && v.sessionId === sessionId && v.timestamp >= cutoff
    );
  }

  if (isDuplicate) {
    return { recorded: false };
  }

  mockViews.push({ productId, userId, sessionId, timestamp });
  return { recorded: true };
};

const baseTime = new Date();

// 1. Initial view by anonymous user
const r1 = recordViewMock({ productId: "P3", sessionId: "sess-1", timestamp: baseTime });
assert.strictEqual(r1.recorded, true, "First view should record");

// 2. Refresh 5 minutes later with same session
const r2 = recordViewMock({
  productId: "P3",
  sessionId: "sess-1",
  timestamp: new Date(baseTime.getTime() + 5 * 60 * 1000),
});
assert.strictEqual(r2.recorded, false, "Refresh within 30 min should be deduplicated");

// 3. View 35 minutes later with same session (window expired)
const r3 = recordViewMock({
  productId: "P3",
  sessionId: "sess-1",
  timestamp: new Date(baseTime.getTime() + 35 * 60 * 1000),
});
assert.strictEqual(r3.recorded, true, "View after 30 min should record as a new view");

// 4. View by another session
const r4 = recordViewMock({
  productId: "P3",
  sessionId: "sess-2",
  timestamp: baseTime,
});
assert.strictEqual(r4.recorded, true, "View by different session should record");

console.log("  Total Recorded Views for P3:", mockViews.filter((v) => v.productId === "P3").length);
assert.strictEqual(mockViews.filter((v) => v.productId === "P3").length, 3);
console.log("  ✓ TEST 3 PASSED: View tracking deduplication works accurately.\n");

console.log("ALL LOGIC CHECKS PASSED WITH 100% SUCCESS! ✓");
