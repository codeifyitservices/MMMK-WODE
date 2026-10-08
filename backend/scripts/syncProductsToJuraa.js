const mongoose = require("mongoose");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../Config/db");
const Product = require("../Models/Product");
const SKU = require("../Models/sku");
const Category = require("../Models/Category"); // Ensure Category model is loaded for population

const API_URL = "https://juraa.co/api/rest/v1/product/add";
const API_KEY = process.env.JURA_API_KEY;
const BASE_IMAGE_URL = process.env.VITE_IMAGE_URL || "https://node.projects.codenap.in/mmk/uploads/";

const syncProducts = async () => {
  try {
    await connectDB();
    console.log("Connected to Database...");

    // Fetch all products and populate category
    const products = await Product.find({}).populate("category");
    console.log(`Found ${products.length} products.`);

    const formattedProducts = [];

    for (const product of products) {
      // Find SKUs for this product
      const skus = await SKU.find({ product: product._id });

      // Determine filter names
      // Assuming product.filters contains strings like ["Size", "Color"]
      // If product.filters is empty but SKUs exist, we might need to infer from SKU filters (which are Mixed/Object)
      let filterNames = product.filters || [];
      if (filterNames.length === 0 && skus.length > 0 && skus[0].filters) {
        filterNames = Object.keys(skus[0].filters);
      }

      // Map SKUs to variants
      let variants = [];
      if (skus.length > 0) {
        variants = skus.map((sku) => {
          // Extract filter values based on filterNames order
          const filterValues = filterNames.map((name) => sku.filters?.[name] || "");

          return {
            id: sku._id.toString(),
            sku: sku.sku,
            price: product.websitePrice || product.price || 0,
            barcode: sku.sku, // Fallback
            filterValues: filterValues,
            images: product.images && product.images.length > 0 
                    ? product.images.map(img => img.startsWith("http") ? img : `${BASE_IMAGE_URL}${img}`) 
                    : (product.image ? [product.image.startsWith("http") ? product.image : `${BASE_IMAGE_URL}${product.image}`] : []),
            discount: product.discount || 0,
            discountType: "percentage",
          };
        });
      } else {
        // If no SKUs, create a single variant representing the product
        variants.push({
          id: product._id.toString() + "_var",
          sku: product._id.toString(),
          price: product.websitePrice || product.price || 0,
          barcode: product._id.toString(),
          filterValues: [],
          images: product.images && product.images.length > 0 
                  ? product.images.map(img => img.startsWith("http") ? img : `${BASE_IMAGE_URL}${img}`) 
                  : (product.image ? [product.image.startsWith("http") ? product.image : `${BASE_IMAGE_URL}${product.image}`] : []),
          discount: product.discount || 0,
          discountType: "percentage",
        });
      }

      const productPayload = {
        id: product._id.toString(),
        productName: product.productName?.en || "Unnamed Product",
        productDescription: product.productDescription?.en || "No Description",
        productDimensions: {
          length: 1, // Placeholder (avoid 0)
          width: 1,  // Placeholder (avoid 0)
          height: 1, // Placeholder (avoid 0)
          weight: product.weight || 0.5,
        },
        filterNames: filterNames,
        currency: "AED",
        countryOfOrigin: "United Arab Emirates",
        category: product.category?.name?.en || "General",
        brand: product.brand || "Generic",
        variants: variants,
      };

      formattedProducts.push(productPayload);
    }

    // Log the first product payload for debugging purposes
    if (formattedProducts.length > 0) {
        console.log("Sample Payload (First Product):", JSON.stringify(formattedProducts[0], null, 2));
    }

    const payload = {
      products: formattedProducts,
    };

    console.log(`Sending payload with ${formattedProducts.length} products to Juraa API...`);

    try {
      const response = await axios.post(API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
      });

      console.log("Sync Successful!");
      console.log("Response Data:", response.data);
    } catch (apiError) {
      console.error("API Error Message:", apiError.message);
      if (apiError.response) {
        console.error("API Response Data (Full):", JSON.stringify(apiError.response.data, null, 2));
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Script failed:", err);
    process.exit(1);
  }
};

syncProducts();
