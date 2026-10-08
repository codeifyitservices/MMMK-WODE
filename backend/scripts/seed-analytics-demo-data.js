const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");
const dayjs = require("dayjs");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

const Product = require("../Models/Product");
const Order = require("../Models/Order");
const ProductView = require("../Models/ProductView");
const User = require("../Models/User");

async function seedAnalyticsData() {
  console.log("=== SEEDING ANALYTICS DEMO DATA ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.");

  // Fetch or create products
  let products = await Product.find({ status: "Active" }).limit(10).lean();

  if (!products || products.length < 5) {
    console.log("Creating sample products...");
    const sampleProducts = [
      {
        productName: { en: "Silk Rose Oud Perfume" },
        price: 350,
        status: "Active",
        image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=500&q=80",
        sku: "PERF-OUD-01",
      },
      {
        productName: { en: "Amber Gold Extrait De Parfum" },
        price: 650,
        status: "Active",
        image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&q=80",
        sku: "PERF-AMB-02",
      },
      {
        productName: { en: "Velvet Musk Body Mist" },
        price: 180,
        status: "Active",
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&q=80",
        sku: "PERF-MSK-03",
      },
      {
        productName: { en: "Royal Sandalwood Incense" },
        price: 240,
        status: "Active",
        image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=500&q=80",
        sku: "INC-SND-04",
      },
      {
        productName: { en: "Imperial Saffron Elixir" },
        price: 920,
        status: "Active",
        image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500&q=80",
        sku: "PERF-SAF-05",
      },
      {
        productName: { en: "Midnight Bergamot Cologne" },
        price: 290,
        status: "Active",
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&q=80",
        sku: "PERF-BER-06",
      },
    ];

    const created = await Product.insertMany(sampleProducts);
    products = created.map((p) => p.toObject());
  }

  console.log(`Using ${products.length} products for seed data.`);

  // Find or create a dummy demo user
  let user = await User.findOne().select("_id").lean();
  if (!user) {
    user = await User.create({
      firstName: "Demo",
      lastName: "Customer",
      email: "demo.customer@example.com",
      password: "password123",
      role: "User",
    });
  }

  const userId = user._id;

  // Clear previous demo seed orders & views
  await Order.deleteMany({ orderId: { $regex: /^SEED-ORD-/ } });
  await ProductView.deleteMany({ sessionId: { $regex: /^seed_session_/ } });

  console.log("Cleared old seed demo data.");

  // Configured sales targets for top products to create distinct rankings:
  // Product 0: Most Sold (Units = ~145, Rev = ~50,750 AED)
  // Product 4: Highest Revenue (Units = ~68, Rev = ~62,560 AED)
  // Product 1: High Rev & Sold (Units = ~55, Rev = ~35,750 AED)
  // Product 2: Medium Sold (Units = ~80, Rev = ~14,400 AED)
  // Product 3: Medium (Units = ~42, Rev = ~10,080 AED)
  // Product 5: Moderate (Units = ~35, Rev = ~10,150 AED)

  const distribution = [
    { prodIdx: 0, targetQty: 145, unitPrice: products[0]?.price || 350 },
    { prodIdx: 4, targetQty: 68, unitPrice: products[4]?.price || 920 },
    { prodIdx: 1, targetQty: 55, unitPrice: products[1]?.price || 650 },
    { prodIdx: 2, targetQty: 80, unitPrice: products[2]?.price || 180 },
    { prodIdx: 3, targetQty: 42, unitPrice: products[3]?.price || 240 },
    { prodIdx: 5, targetQty: 35, unitPrice: products[5]?.price || 290 },
  ];

  const ordersToInsert = [];
  let orderCounter = 1000;

  // Generate distributed orders over the past 28 days (including today and last 7 days)
  for (const item of distribution) {
    const product = products[item.prodIdx % products.length];
    let remainingQty = item.targetQty;

    while (remainingQty > 0) {
      orderCounter++;
      const orderQty = Math.min(remainingQty, Math.floor(Math.random() * 4) + 1);
      remainingQty -= orderQty;

      const daysAgo = Math.floor(Math.random() * 26);
      const hoursAgo = Math.floor(Math.random() * 24);
      const orderDate = dayjs().subtract(daysAgo, "day").subtract(hoursAgo, "hour").toDate();

      const lineTotal = orderQty * item.unitPrice;

      ordersToInsert.push({
        userId,
        orderId: `SEED-ORD-${orderCounter}`,
        status: "Complete",
        paymentStatus: "Paid",
        mode: "card",
        currency: "AED",
        currencyRate: 0.27,
        amount: lineTotal,
        totalQuantity: orderQty,
        price: {
          subtotal: lineTotal,
          total: lineTotal,
          payableTotal: lineTotal,
          shippingCharges: 0,
        },
        products: [
          {
            id: product._id,
            sku: product.sku || `SKU-${item.prodIdx}`,
            name: product.productName?.en || "Perfume",
            quantity: orderQty,
            amount: lineTotal,
          },
        ],
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }
  }

  await Order.insertMany(ordersToInsert);
  console.log(`Inserted ${ordersToInsert.length} demo orders across the last 30 days.`);

  // Generate realistic product views for Most Viewed page
  // Product 2 (Velvet Musk): 650 views
  // Product 0 (Silk Rose Oud): 480 views
  // Product 4 (Imperial Saffron): 390 views
  // Product 1 (Amber Gold): 310 views
  // Product 5 (Midnight Bergamot): 240 views
  // Product 3 (Royal Sandalwood): 180 views

  const viewDistribution = [
    { prodIdx: 2, viewsCount: 650 },
    { prodIdx: 0, viewsCount: 480 },
    { prodIdx: 4, viewsCount: 390 },
    { prodIdx: 1, viewsCount: 310 },
    { prodIdx: 5, viewsCount: 240 },
    { prodIdx: 3, viewsCount: 180 },
  ];

  const viewsToInsert = [];
  let viewSessionCounter = 1;

  for (const item of viewDistribution) {
    const product = products[item.prodIdx % products.length];
    for (let i = 0; i < item.viewsCount; i++) {
      viewSessionCounter++;
      const daysAgo = Math.floor(Math.random() * 28);
      const minutesAgo = Math.floor(Math.random() * 1440);
      const viewDate = dayjs().subtract(daysAgo, "day").subtract(minutesAgo, "minute").toDate();

      viewsToInsert.push({
        productId: product._id,
        sessionId: `seed_session_${viewSessionCounter}`,
        userId: i % 4 === 0 ? userId : null,
        timestamp: viewDate,
        createdAt: viewDate,
      });
    }
  }

  await ProductView.insertMany(viewsToInsert);
  console.log(`Inserted ${viewsToInsert.length} demo PDP views across the last 30 days.`);

  console.log("\n=== SEED DATA COMPLETED SUCCESSFULLY! ===");
  console.log("Summary of Seeded Rankings:");
  console.log("1. Most Sold (Units Sold): Silk Rose Oud Perfume (~145 pcs)");
  console.log("2. Highest Revenue: Imperial Saffron Elixir (~62,560 AED)");
  console.log("3. Most Viewed: Velvet Musk Body Mist (~650 views)");

  await mongoose.disconnect();
}

seedAnalyticsData().catch((err) => {
  console.error("Seeding Error:", err);
  process.exit(1);
});
