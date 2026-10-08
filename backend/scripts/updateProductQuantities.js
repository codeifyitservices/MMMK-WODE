const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../Config/db");
const Product = require("../Models/Product");
const SKU = require("../Models/sku");

/**
 * This script updates all products' quantity field by calculating
 * the sum of all their SKUs' quantities
 */
const updateProductQuantities = async () => {
    try {
        await connectDB();
        console.log("Connected to Database...");

        // Fetch all products
        const products = await Product.find({});
        console.log(`Found ${products.length} products to update.`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const product of products) {
            // Find all SKUs for this product
            const skus = await SKU.find({ product: product._id });

            // Calculate total quantity from all SKUs
            const totalQuantity = skus.reduce((sum, sku) => {
                return sum + (sku.quantity || 0);
            }, 0);

            // Update product quantity if it's different
            if (product.quantity !== totalQuantity) {
                product.quantity = totalQuantity;

                // Also update status based on quantity
                if (totalQuantity === 0 && product.status !== "Out of stock") {
                    product.status = "Out of stock";
                } else if (totalQuantity > 0 && product.status === "Out of stock") {
                    product.status = "Active";
                }

                await product.save();
                console.log(
                    `✅ Updated: ${product.productName?.en || product._id} - Quantity: ${totalQuantity}, Status: ${product.status}`
                );
                updatedCount++;
            } else {
                console.log(
                    `⏭️  Skipped: ${product.productName?.en || product._id} - Already correct (${totalQuantity})`
                );
                skippedCount++;
            }
        }

        console.log("\n" + "=".repeat(50));
        console.log("Migration Complete!");
        console.log(`✅ Updated: ${updatedCount} products`);
        console.log(`⏭️  Skipped: ${skippedCount} products (already correct)`);
        console.log(`📊 Total: ${products.length} products processed`);
        console.log("=".repeat(50));

        process.exit(0);
    } catch (err) {
        console.error("Script failed:", err);
        process.exit(1);
    }
};

updateProductQuantities();
