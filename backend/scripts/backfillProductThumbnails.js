const mongoose = require("mongoose");
const Product = require("../Models/Product");
const connectDB = require("../Config/db");
const { generateProductThumbnail } = require("../utils/productThumbnail");
require("dotenv").config();

const backfillProductThumbnails = async () => {
  const stats = {
    scanned: 0,
    updated: 0,
    generated: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    await connectDB();

    const products = await Product.find({
      $or: [
        { image: { $nin: [null, ""] } },
        { images: { $exists: true, $ne: [] } },
      ],
    }).select("_id image thumbnail images productName");

    stats.scanned = products.length;

    for (const product of products) {
      try {
        let changed = false;
        const imageNames = [
          product.image,
          ...(Array.isArray(product.images) ? product.images : []),
        ].filter(Boolean);

        if (!imageNames.length) {
          stats.skipped += 1;
          continue;
        }

        const generatedThumbnails = await Promise.all(
          imageNames.map((image) => generateProductThumbnail(image))
        );
        stats.generated += generatedThumbnails.filter(Boolean).length;

        const thumbnail = generatedThumbnails[0];

        if (thumbnail && !product.thumbnail) {
          product.thumbnail = thumbnail;
          changed = true;
        }

        if (!generatedThumbnails.some(Boolean)) {
          stats.skipped += 1;
          continue;
        }

        if (changed) {
          await product.save();
          stats.updated += 1;
        }
      } catch (error) {
        stats.failed += 1;
        console.error(`Failed to backfill thumbnail for product ${product._id}:`, error);
      }
    }

    console.log("Product thumbnail backfill complete:", stats);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Product thumbnail backfill failed:", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

backfillProductThumbnails();
