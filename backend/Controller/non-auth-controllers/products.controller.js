const Category = require("../../Models/Category");
const Product = require("../../Models/Product");
const ProductView = require("../../Models/ProductView");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const sku = require("../../Models/sku");
const { searchCatalog } = require("../../services/searchService");

const ensureProductOrder = async () => {
  const unorderedProducts = await Product.find({
    $or: [{ order: { $exists: false } }, { order: null }],
  })
    .sort({ createdAt: 1, _id: 1 })
    .select("_id")
    .lean();

  if (!unorderedProducts.length) return;

  const lastOrderedProduct = await Product.findOne({
    order: { $ne: null },
  })
    .sort({ order: -1 })
    .select("order")
    .lean();

  const startOrder = Number.isFinite(lastOrderedProduct?.order)
    ? lastOrderedProduct.order + 1
    : 0;

  await Product.bulkWrite(
    unorderedProducts.map((product, index) => ({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: { order: startOrder + index } },
      },
    }))
  );
};

const getAllProducts = async (req, res) => {
  try {
    await ensureProductOrder();
    const {
      page = 1,
      limit = 12,
      categories,
      gender,
      price,
      discount,
      brand,
      sort,
      q,
      ...customFilters
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // Helper to ensure value is always an array
    const toArray = (val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    };

    // 1. Build Base Filter for Products
    let baseProductMatch = { status: { $ne: "Inactive" } };

    const categoryArr = toArray(categories);
    if (categoryArr.length > 0) {
      const matchedCategories = await Category.find({ "name.en": { $in: categoryArr } }).select("_id").lean();
      if (matchedCategories.length > 0) {
        baseProductMatch.category = { $in: matchedCategories.map(cat => cat._id) };
      }
    }

    const genderArr = toArray(gender);
    if (genderArr.length > 0) baseProductMatch.gender = { $in: genderArr };

    const brandArr = toArray(brand);
    if (brandArr.length > 0) baseProductMatch.brand = { $in: brandArr };

    const priceArr = toArray(price);
    if (priceArr.length > 0) {
       const priceQueries = priceArr.map(p => {
          const [from, to] = p.split(",").map(Number);
          return { price: { $gte: from, $lte: to } };
       });
       baseProductMatch.$or = [...(baseProductMatch.$or || []), ...priceQueries];
    }

    const discountArr = toArray(discount).map(Number).filter(Boolean);
    if (discountArr.length > 0) {
       const discountQueries = discountArr.map(d => ({ discount: { $lte: d } }));
       baseProductMatch.$or = [...(baseProductMatch.$or || []), ...discountQueries];
    }

    // 2. Resolve SKU-level Filters (Size, Color, etc.)
    const skuFilterKeys = Object.keys(customFilters).filter(k => 
      ['size', 'color'].includes(k.toLowerCase()) || 
      toArray(customFilters[k]).length > 0
    );

    let productIdsFromSkus = null;
    if (skuFilterKeys.length > 0) {
      const skuMatch = {};
      skuFilterKeys.forEach(key => {
        const values = toArray(customFilters[key]);
        if (values.length > 0) {
          // Map common keys to DB casing
          let dbKey = key;
          const keyLower = key.toLowerCase();
          if (keyLower === 'size') dbKey = 'Size';
          if (keyLower === 'color') dbKey = 'Color';

          skuMatch[`filters.${dbKey}`] = { $in: values };
        }
      });

      const matchingSkus = await sku.find(skuMatch).select("product").lean();
      productIdsFromSkus = matchingSkus.map(s => s.product);
      
      // If we have SKU filters but no matches, force empty result
      if (productIdsFromSkus.length === 0) {
          return res.status(200).json({
            success: true,
            data: [],
            pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 }
          });
      }
      
      baseProductMatch._id = { $in: productIdsFromSkus };
    }

    // 3. Handle Sorting
    const getSortQuery = (sortValue) => {
      switch (sortValue) {
        case "priceAsc": return { websitePrice: 1, price: 1, createdAt: 1 };
        case "priceDesc": return { websitePrice: -1, price: -1, createdAt: 1 };
        case "newest": return { createdAt: -1, _id: -1 };
        case "nameAsc": return { "productName.en": 1, createdAt: 1 };
        default: return { order: 1, createdAt: 1 };
      }
    };

    // 4. Final Query Execution
    let products = [];
    let total = 0;

    if (q) {
      // Fuzzy Search Logic (preserved from existing implementation)
      const { products: fuzzyProducts } = await searchCatalog(q, {
        includeCategories: false,
        includeProducts: true,
        productLimit: 500,
      });

      // Filter fuzzy results by our match criteria
      const filteredProducts = fuzzyProducts.filter(p => {
         // Category check
         if (baseProductMatch.category && !baseProductMatch.category.$in.some(id => String(id) === String(p.category?._id || p.category))) return false;
         // Gender check
         if (baseProductMatch.gender && !baseProductMatch.gender.$in.includes(p.gender)) return false;
         // Brand check
         if (baseProductMatch.brand && !baseProductMatch.brand.$in.includes(p.brand)) return false;
         // Price/Discount $or check
         if (baseProductMatch.$or) {
            const matchesOr = baseProductMatch.$or.some(cond => {
               if (cond.price) return p.price >= cond.price.$gte && p.price <= cond.price.$lte;
               if (cond.discount) return (p.discount || 0) <= cond.discount.$lte;
               return false;
            });
            if (!matchesOr) return false;
         }
         // SKU filter check
         if (productIdsFromSkus && !productIdsFromSkus.some(id => String(id) === String(p._id))) return false;
         
         return true;
      });

      // Sort fuzzy results
      filteredProducts.sort((a, b) => {
         const s = sort;
         if (s === 'priceAsc') return (a.websitePrice || a.price || 0) - (b.websitePrice || b.price || 0);
         if (s === 'priceDesc') return (b.websitePrice || b.price || 0) - (a.websitePrice || a.price || 0);
         if (s === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
         if (s === 'nameAsc') return String(a.productName?.en).localeCompare(String(b.productName?.en));
         return (a.order || 0) - (b.order || 0);
      });

      total = filteredProducts.length;
      products = filteredProducts.slice(skip, skip + limitNum);
    } else {
      // Standard Filter Logic
      total = await Product.countDocuments(baseProductMatch);
      products = await Product.find(baseProductMatch)
        .sort(getSortQuery(sort))
        .skip(skip)
        .limit(limitNum)
        .populate([{ path: "category" }, { path: "subCategory" }])
        .lean();
    }

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId).select("category");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: productId },
      category: product.category,
    }).limit(4);

    res.status(200).json({
      success: true,
      data: relatedProducts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAllProductsWithFilters = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 12,
      gender = [],
      brands = [],
      price = [],
      discount = [],
      categories = [], // category names, not IDs
      showOnHomepage = false,
    } = req.query;

    const matchStage = {};

    if (showOnHomepage === 'true' || showOnHomepage === true) matchStage.showOnHomepage = true;
    if (gender.length > 0) matchStage.gender = { $in: Array.isArray(gender) ? gender : [gender] };
    if (brands.length > 0) matchStage.brandName = { $in: Array.isArray(brands) ? brands : [brands] };
    if (price.length > 0)
      matchStage.websitePrice = { $lte: Math.max(...(Array.isArray(price) ? price : [price]).map(Number)) };
    if (discount.length > 0)
      matchStage.discount = { $lte: Math.max(...(Array.isArray(discount) ? discount : [discount]).map(Number)) };

    let products;
    let total;

    if (categories.length > 0) {
      // Build aggregation pipeline for category lookup
      const categoriesArr = Array.isArray(categories) ? categories : [categories];
      let pipeline = [
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        {
          $match: {
            ...matchStage,
            "categoryDetails.name.en": { $in: categoriesArr },
          },
        },
      ];

      const countResult = await Product.aggregate([...pipeline, { $count: "total" }]);
      total = countResult[0]?.total || 0;

      pipeline.push(
        { $sort: { order: 1, createdAt: 1 } },
        { $skip: (Number(page) - 1) * Number(pageSize) },
        { $limit: Number(pageSize) }
      );
      products = await Product.aggregate(pipeline);
    } else {
      // Use much faster find().lean() when no category join is needed
      products = await Product.find(matchStage)
        .sort({ order: 1, createdAt: 1 })
        .skip((Number(page) - 1) * Number(pageSize))
        .limit(Number(pageSize))
        .lean();
      
      total = await Product.countDocuments(matchStage);
    }

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
      },
    });
  } catch (err) {
    console.error("getAllProductsWithFilters error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getBrands = async (req, res) => {
  try {
    const data = await Product.aggregate([
      {
        $group: {
          _id: "$brandName",
        },
      },
      {
        $replaceRoot: { newRoot: "$_id" },
      },
    ]);
    res.status(201).json({
      success: true,
      message: "Brand name fetch successfully",
      data: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Brands fetch successfully",
    });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate("category");
    res.status(200).json({
      success: true,
      message: "Products Fetched Successfully!",
      data: product || [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
const getProductSkus = async (req, res) => {
  try {
    const id = req.params.id;
    
    const skus = await sku.find({ product: id });
    
    res.status(200).json({
      success: true,
      message: "Skus Fetched Successfully!",
      data: skus || [],
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getRandomProducts = async (req, res) => {
  try {
    const randomProducts = await Product.aggregate([{ $sample: { size: 8 } }]);

    res.status(200).json({
      success: true,
      data: randomProducts,
    });
  } catch (error) {
    console.error("Error fetching random products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch random products",
      error: error.message,
    });
  }
};

const getHomePageBottomSectionList = async (req, res) => {
  try {
    await ensureProductOrder();
    const products = await Product.find({ homePageBottomSection: true })
      .sort({ order: 1, createdAt: 1 })
      .lean()
      .limit(8);
    res.status(200).json({
      success: true,
      message: "Products Fetched Successfully!",
      data: products || [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const { suggestions } = await searchCatalog(q, {
      includeCategories: true,
      includeProducts: true,
      suggestionLimit: Number(limit),
      productLimit: Number(limit),
    });

    res.status(200).json({
      success: true,
      message: "Search results fetched successfully",
      data: suggestions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const recordProductView = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId: bodySessionId } = req.body || {};
    const headerSessionId = req.headers["x-session-id"];
    const cookieSessionId = req.cookies?.sessionId;
    const sessionId = (bodySessionId || headerSessionId || cookieSessionId || "").toString().trim() || null;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const productExists = await Product.exists({ _id: id });
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let userId = null;
    const authHeader = req.headers.authorization || req.headers.Authorization || "";
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7).trim();
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded?.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
          userId = decoded.id;
        }
      } catch (err) {
        // Token invalid/expired; continue as anonymous visitor
      }
    }

    // 30-minute deduplication window
    const DEDUPLICATION_WINDOW_MS = 30 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - DEDUPLICATION_WINDOW_MS);

    let duplicateQuery = null;
    if (userId) {
      duplicateQuery = {
        productId: id,
        userId: userId,
        timestamp: { $gte: cutoffDate },
      };
    } else if (sessionId) {
      duplicateQuery = {
        productId: id,
        sessionId: sessionId,
        timestamp: { $gte: cutoffDate },
      };
    }

    if (duplicateQuery) {
      const existingView = await ProductView.findOne(duplicateQuery).select("_id").lean();
      if (existingView) {
        return res.status(200).json({
          success: true,
          recorded: false,
          message: "View already recorded within deduplication window",
        });
      }
    }

    const newView = await ProductView.create({
      productId: id,
      userId: userId || null,
      sessionId: sessionId || null,
      timestamp: new Date(),
    });

    return res.status(201).json({
      success: true,
      recorded: true,
      message: "Product view recorded successfully",
      viewId: newView._id,
    });
  } catch (err) {
    console.error("Error recording product view:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to record product view",
      error: err.message,
    });
  }
};

module.exports = {
  getAllProducts,
  getRelatedProducts,
  getAllProductsWithFilters,
  getBrands,
  getSingleProduct,
  getRandomProducts,
  getProductSkus,
  getHomePageBottomSectionList,
  searchProducts,
  recordProductView,
};
