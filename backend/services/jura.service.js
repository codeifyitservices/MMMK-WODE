const axios = require('axios');
const Product = require('../Models/Product');
const SKU = require('../Models/sku');
const logger = require('../utils/logger');

/**
 * Resolves a filename to a full absolute URL for the Jura API.
 */
const resolveAssetUrl = (filename) => {
  if (!filename) return "";
  if (/^(?:https?:)?\/\//i.test(filename)) return filename;
  
  // Match the frontend's VITE_IMAGE_URL fallback
  const baseUrl = process.env.PUBLIC_UPLOAD_BASE_URL || 'https://node.projects.codenap.in/mmk/uploads';
  return `${baseUrl.replace(/\/$/, "")}/${filename.replace(/^\/+/, "")}`;
};

/**
 * Formats a single product and its SKUs for the Jura API.
 */
const formatProductForJura = (product, skus) => {
  const price = Math.max(0, Number(product.price) || Number(product.websitePrice) || 0);
  
  return {
    id: product._id.toString(),
    productName: product.productName?.en || '',
    productDescription: product.productDescription?.en || '',
    productDimensions: {
      length: product.length || 0,
      width: product.width || 0,
      height: product.height || 0,
      weight: product.weight || 0.5
    },
    filterNames: product.filters || [],
    currency: "AED",
    countryOfOrigin: "United Arab Emirates",
    category: product.category?.name?.en || 'Apparel',
    brand: product.brand || 'UrbanFlex',
    variants: skus.map(s => ({
      id: s._id.toString(),
      sku: s.sku,
      price: price,
      barcode: s.sku, // Defaulting to SKU as barcode
      filterValues: s.filters ? Object.values(s.filters) : [],
      images: [product.image, ...(product.images || [])]
        .filter(Boolean)
        .map(img => resolveAssetUrl(img)),
      discount: product.discount || 0,
      discountType: "percentage"
    }))
  };
};

/**
 * Syncs the current product and all products created in the last week to Jura.
 * @param {string} currentProductId - The ID of the product just added or updated.
 */
const syncProductsToJura = async (currentProductId) => {
  try {
    const juraUrl = process.env.JURA_URL ? process.env.JURA_URL.replace(/\/$/, '') : 'https://juraa.co/api/rest/v1';
    const apiKey = process.env.JURA_API_KEY;

    if (!apiKey) {
      logger.error('JURA_API_KEY is missing in environment variables');
      return;
    }

    logger.info(`Starting sync for product: ${currentProductId}`);

    // 1. Get current product with category populated
    const currentProduct = await Product.findById(currentProductId).populate('category').lean();
    if (!currentProduct) {
      logger.error(`Product not found in database: ${currentProductId}`);
      return;
    }

    // 2. Get products created in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentProducts = await Product.find({
      createdAt: { $gte: oneWeekAgo },
      _id: { $ne: currentProductId } // Exclude current to avoid duplicate processing
    }).populate('category').lean();

    const allProductsToSync = [currentProduct, ...recentProducts];
    
    // 3. Map all products to Jura format
    const productsPayload = await Promise.all(allProductsToSync.map(async (p) => {
      const skus = await SKU.find({ product: p._id }).lean();
      return formatProductForJura(p, skus);
    }));

    const payload = {
      products: productsPayload
    };

    logger.info(`Syncing ${allProductsToSync.length} products to Jura API...`, { 
      productCount: allProductsToSync.length,
      sampleImage: productsPayload[0]?.variants[0]?.images[0] 
    });

    // The user provided URL: https://juraa.co/api/rest/v1//product/add
    // I'll use the one from env if available, otherwise the one in the prompt.
    const endpoint = `${juraUrl}/product/add`;

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    logger.info('Jura Sync Response:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error syncing products to Jura:', error.response?.data || error.message);
  }
};

/**
 * Syncs a specific list of products by their English names to Jura.
 * @param {string[]} productNames - List of product names to sync.
 */
const syncSpecificProductsToJura = async (productNames) => {
  try {
    const juraUrl = process.env.JURA_URL ? process.env.JURA_URL.replace(/\/$/, '') : 'https://juraa.co/api/rest/v1';
    const apiKey = process.env.JURA_API_KEY;

    if (!apiKey) {
      logger.error('JURA_API_KEY is missing in environment variables');
      return;
    }

    logger.info(`Starting manual sync for ${productNames.length} products by name.`);

    // Find products matching the names (case-insensitive if needed, but exact match first)
    // Create a case-insensitive regex array for the names to be safe
    const regexNames = productNames.map(name => new RegExp(`^${name.trim()}$`, 'i'));

    const products = await Product.find({
      'productName.en': { $in: regexNames }
    }).populate('category').lean();

    if (products.length === 0) {
      logger.error(`No products found matching the provided names.`);
      return;
    }

    logger.info(`Found ${products.length} products matching the criteria.`);

    // Map all products to Jura format
    const productsPayload = await Promise.all(products.map(async (p) => {
      const skus = await SKU.find({ product: p._id }).lean();
      return formatProductForJura(p, skus);
    }));

    const payload = {
      products: productsPayload
    };

    logger.info(`Sending manual sync of ${products.length} products to Jura API...`, { 
      productCount: products.length,
      sampleImage: productsPayload[0]?.variants[0]?.images[0] 
    });

    const endpoint = `${juraUrl}/product/add`;

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      }
    });

    logger.info('Manual Jura Sync Response:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error in manual sync products to Jura:', error.response?.data || error.message);
  }
};

module.exports = { syncProductsToJura, syncSpecificProductsToJura };

