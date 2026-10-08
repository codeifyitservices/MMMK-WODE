const { default: mongoose } = require("mongoose");
const Product = require("../../../Models/Product");
const deleteFile = require("../../../utils/deleteFile");
const sku = require("../../../Models/sku");
const { translateText } = require("../../../services/translate");
const { getTranslatedFields } = require("./product.helpers");
const { LANGUAGECODES } = require("../../../utils/staticData");
const {
  getUploadedFileName,
  getUploadedFileNames,
  parseJsonBodyField,
} = require("../../../utils/requestUploads");
const { syncProductsToJura } = require("../../../services/jura.service");
const logger = require("../../../utils/logger");
const {
  safeStartSession,
  safeCommitTransaction,
  safeAbortTransaction,
  safeEndSession,
} = require("../../../utils/dbUtils");
const { generateProductThumbnail } = require("../../../utils/productThumbnail");

const fieldsWithTranslations = [
  "productName",
  "productDescription",
  "uses",
  "benefits",
];

const normalizeImageList = (images = [], primaryImage = null) => {
  const uniqueImages = [];
  const seen = new Set();

  for (const image of images) {
    if (!image || image === primaryImage || seen.has(image)) continue;
    seen.add(image);
    uniqueImages.push(image);
  }

  return uniqueImages;
};

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

const create = async (req, res) => {
  const session = await safeStartSession();
  let committed = false;
  let imagesUploaded = getUploadedFileNames(req, "images");
  let primaryImage = getUploadedFileName(req, "image");
  let primaryThumbnail = null;
  try {
    const incommingData = req.body;
    await ensureProductOrder();
    const lastProduct = await Product.findOne()
      .sort({ order: -1, createdAt: -1 })
      .select("order")
      .lean();


    const dataToStore = {
      category: incommingData.category,
      subCategory: incommingData.subCategory,
      // quantity will be calculated from SKUs
      status: incommingData.status,
      productName: parseJsonBodyField(
        incommingData.productName,
        {},
        "productName"
      ),
      productDescription: parseJsonBodyField(
        incommingData.productDescription,
        {},
        "productDescription"
      ),
      uses: parseJsonBodyField(incommingData.uses, {}, "uses"),
      benefits: parseJsonBodyField(incommingData.benefits, {}, "benefits"),
      price: incommingData.price,
      discount: incommingData.discount,
      gender: incommingData.gender,
      weight: incommingData.weight,
      brand: incommingData.brand,
      websitePrice: incommingData.websitePrice,
      homePageBottomSection: incommingData.homePageBottomSection,
      images: normalizeImageList(imagesUploaded, primaryImage),
      image: primaryImage || null,
      thumbnail: null,
      filters: parseJsonBodyField(incommingData.filters, [], "filters"),
      skus: parseJsonBodyField(incommingData.skus, [], "skus"),
      showOnHomepage: incommingData.showOnHomepage || false,
      order: Number.isFinite(lastProduct?.order) ? lastProduct.order + 1 : 0,
    };

    if (dataToStore.skus.length === 0) {
      return res
        .status(400)
        .json({ success: false, showMessage: "SKUs are required" });
    }

    primaryThumbnail = await generateProductThumbnail(primaryImage);
    dataToStore.thumbnail = primaryThumbnail;
    await Promise.all(
      dataToStore.images.map((image) => generateProductThumbnail(image))
    );

    // Extract unique filter values from SKUs and add to product
    const filterValues = {};
    dataToStore.skus.forEach(skuData => {
      if (skuData.filters) {
        Object.keys(skuData.filters).forEach(filterKey => {
          const normalizedKey = filterKey.toLowerCase().replace(/\s+/g, '');
          if (!filterValues[normalizedKey]) {
            filterValues[normalizedKey] = new Set();
          }
          filterValues[normalizedKey].add(skuData.filters[filterKey]);
        });
      }
    });

    // Add filter values as direct fields on product
    Object.keys(filterValues).forEach(key => {
      dataToStore[key] = Array.from(filterValues[key])[0]; // Use first value for counting
    });

    // Calculate total quantity from all SKUs
    const totalQuantity = dataToStore.skus.reduce((sum, skuData) => {
      return sum + (parseInt(skuData.quantity) || 0);
    }, 0);
    dataToStore.quantity = totalQuantity;

    const savedData = await Product.create([dataToStore], {
      session,
    });


    await sku.insertMany(
      dataToStore.skus.map((skuData) => ({
        product: savedData[0]._id,
        sku: skuData.sku,
        quantity: skuData.quantity,
        filters: skuData.filters,
      })),
      { session }
    );

    await safeCommitTransaction(session);
    committed = true;

    res.status(201).json({
      success: true,
      message: "Product Created Successfully!",
      data: savedData[0],
    });

    // Sync to Jura (Non-blocking)
    syncProductsToJura(savedData[0]._id).catch((err) =>
      logger.error("Jura sync error on create:", err)
    );
  } catch (err) {
    console.error("Error creating product:", err);
    if (primaryImage) deleteFile(primaryImage);
    if (primaryThumbnail) deleteFile(primaryThumbnail);
    if (imagesUploaded.length) {
      await Promise.all(imagesUploaded.map((image) => deleteFile(image)));
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Product with this SKU already exists`,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server Error",
      showMessage: "Failed to create product",
    });
  } finally {
    if (!committed) {
      await safeAbortTransaction(session);
    }
    safeEndSession(session);
  }
};

const getAllProducts = async (req, res) => {
  try {
    await ensureProductOrder();
    const {
      searchKey,
      searchValue,
      category,
      currentPage = 1,
      pageSize = 10,
      includeSkus = true,
    } = req.query;


    const filter = {};

    if (searchKey && searchValue) {
      if (searchKey === "productName") {
        filter["productName.en"] = { $regex: searchValue, $options: "i" };
      } else if (searchKey === "categoryName") {
        filter.category = searchValue;
      } else if (searchKey === "subcategoryName") {
        filter.subCategory = { $regex: searchValue, $options: "i" };
      }
    }
    if (category) filter.category = new mongoose.Types.ObjectId(category);
    let products = await Product.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .populate([{ path: "category" }, { path: "subCategory" }])
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean();

    if (includeSkus) {
      products = await Promise.all(
        products.map(async (product) => {
          const productSkus = await sku.find({ product: product._id });
          return { ...product, skus: productSkus };
        })
      );
    }

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Products Fetched Successfully!",
      data: products || [],
      total: total || 0,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    const skus = await sku.find({ product: id }).lean();

    res.status(200).json({
      success: true,
      message: "Products Fetched Successfully!",
      data: { ...product, skus } || [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateProduct = async (req, res) => {
  const session = await safeStartSession();
  let committed = false;
  let imagesUploaded = getUploadedFileNames(req, "images");
  let primaryImage = getUploadedFileName(req, "image");
  let generatedThumbnail = null;
  try {
    const { id } = req.params;
    let {
      category,
      subCategory,
      quantity,
      status,
      brand,
      homePageBottomSection,
      price,
      discount,
      gender,
      weight,
      deletedImages,
      finalImages,
      filters,
      skus,
      productName,
      productDescription,
      uses,
      benefits,
      showOnHomepage = false,
      websitePrice,
    } = req.body;


    const newFilters = parseJsonBodyField(filters, [], "filters");
    const newSkus = parseJsonBodyField(skus, [], "skus");
    const newDeletedImages = parseJsonBodyField(
      deletedImages,
      [],
      "deletedImages"
    );
    const newFinalImages = parseJsonBodyField(finalImages, null, "finalImages");


    if (newSkus.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No SKUs provided",
      });
    }

    const product = await Product.findById(id).session(session);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await sku.deleteMany({ product: id }, { session });
    await sku.insertMany(
      newSkus.map((skuData) => ({
        product: product._id,
        sku: skuData.sku,
        quantity: skuData.quantity,
        filters: skuData.filters,
      })),
      { session }
    );

    // Extract unique filter values from SKUs and add to product
    const filterValues = {};
    newSkus.forEach(skuData => {
      if (skuData.filters) {
        Object.keys(skuData.filters).forEach(filterKey => {
          const normalizedKey = filterKey.toLowerCase().replace(/\s+/g, '');
          if (!filterValues[normalizedKey]) {
            filterValues[normalizedKey] = new Set();
          }
          filterValues[normalizedKey].add(skuData.filters[filterKey]);
        });
      }
    });

    // Add filter values as direct fields on product
    Object.keys(filterValues).forEach(key => {
      product[key] = Array.from(filterValues[key])[0]; // Use first value for counting
    });

    // Calculate total quantity from all SKUs
    const totalQuantity = newSkus.reduce((sum, skuData) => {
      return sum + (parseInt(skuData.quantity) || 0);
    }, 0);

    const existingImages = Array.isArray(product.images) ? product.images : [];
    const resolvedPrimaryImage = primaryImage || product.image;
    const nextImages = Array.isArray(newFinalImages)
      ? normalizeImageList(newFinalImages, resolvedPrimaryImage)
      : normalizeImageList([
          ...existingImages.filter(
            (image) =>
              !newDeletedImages.includes(image) && image !== resolvedPrimaryImage
          ),
          ...imagesUploaded.filter((img) => img !== resolvedPrimaryImage),
        ], resolvedPrimaryImage);

    const imagesToDelete = normalizeImageList(
      [
        ...newDeletedImages,
        ...existingImages.filter((image) => !nextImages.includes(image)),
      ],
      resolvedPrimaryImage
    );

    if (imagesToDelete.length) {
      await Promise.all(imagesToDelete.map((image) => deleteFile(image)));
    }

    // Update product fields
    product.category = category;
    product.subCategory = subCategory;
    product.quantity = totalQuantity; // Use calculated quantity from SKUs
    product.status = status;
    product.gender = gender;

    product.productName = parseJsonBodyField(
      productName,
      {},
      "productName"
    );
    product.productDescription = parseJsonBodyField(
      productDescription,
      {},
      "productDescription"
    );
    product.uses = parseJsonBodyField(uses, {}, "uses");
    product.benefits = parseJsonBodyField(benefits, {}, "benefits");
    product.brand = brand;
    product.homePageBottomSection = homePageBottomSection;
    product.price = price;
    product.discount = discount;
    product.websitePrice = websitePrice;
    product.weight = weight;
    // Update images
    const primaryImageChanged = primaryImage && primaryImage !== product.image;
    product.images = nextImages;
    if (primaryImageChanged) {
      deleteFile(product.image);
      if (product.thumbnail) {
        deleteFile(product.thumbnail);
      }
      generatedThumbnail = await generateProductThumbnail(primaryImage);
    }
    product.image = primaryImage || product.image;
    if (primaryImageChanged) {
      product.thumbnail = generatedThumbnail;
    } else if (!product.thumbnail && product.image) {
      generatedThumbnail = await generateProductThumbnail(product.image);
      product.thumbnail = generatedThumbnail;
    }
    await Promise.all(
      product.images.map((image) => generateProductThumbnail(image))
    );
    product.filters = newFilters;
    product.showOnHomepage = showOnHomepage;

    // Save updated product
    await product.save({ session });

    await safeCommitTransaction(session);
    committed = true;

    res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      data: product,
    });

    // Sync to Jura (Non-blocking)
    syncProductsToJura(product._id).catch((err) =>
      logger.error("Jura sync error on update:", err)
    );
  } catch (err) {
    if (primaryImage) deleteFile(primaryImage);
    if (generatedThumbnail) deleteFile(generatedThumbnail);
    if (imagesUploaded.length) {
      await Promise.all(imagesUploaded.map((image) => deleteFile(image)));
    }
    console.error("Error updating product:", err);
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Product with this SKU already exists`,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error, unable to update product",
    });
  } finally {
    if (!committed) {
      await safeAbortTransaction(session);
    }
    safeEndSession(session);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await Product.findById(id);

    await Promise.all((product.images || []).map((image) => deleteFile(image)));
    if (product.image) deleteFile(product.image);
    if (product.thumbnail) deleteFile(product.thumbnail);

    await Product.findByIdAndDelete(id);
    await sku.deleteMany({ product: new mongoose.Types.ObjectId(id) });

    res.status(200).json({
      success: true,
      message: "Product delete successfully!",
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({
      success: false,
      message: "Server error, unable to delete product",
    });
  }
};

const reorderProducts = async (req, res) => {
  try {
    await ensureProductOrder();
    const { orderedItems, orderedIds, category } = req.body;

    const normalizedItems = Array.isArray(orderedItems)
      ? orderedItems
      : Array.isArray(orderedIds)
        ? orderedIds.map((id, index) => ({ id, order: index }))
        : [];

    if (normalizedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderedItems array is required",
      });
    }

    if (category) {
      const categoryId = new mongoose.Types.ObjectId(category);
      const categoryProducts = await Product.find({ category: categoryId })
        .sort({ order: 1, createdAt: 1, _id: 1 })
        .select("_id order")
        .lean();

      const categoryProductMap = new Map(
        categoryProducts.map((product) => [String(product._id), product])
      );
      const reorderedSubset = normalizedItems
        .map(({ id }) => categoryProductMap.get(String(id)))
        .filter(Boolean);

      if (reorderedSubset.length !== normalizedItems.length) {
        return res.status(400).json({
          success: false,
          message: "orderedItems contains products outside the selected category",
        });
      }

      const reorderedIds = new Set(
        reorderedSubset.map((product) => String(product._id))
      );
      const allProducts = await Product.find({})
        .sort({ order: 1, createdAt: 1, _id: 1 })
        .select("_id category")
        .lean();

      let reorderedSubsetIndex = 0;
      const categoryProductsForUpdate = categoryProducts.map((product) => {
        if (reorderedIds.has(String(product._id))) {
          return reorderedSubset[reorderedSubsetIndex++];
        }
        return product;
      });

      let nextCategoryIndex = 0;
      const finalOrder = allProducts.map((product) => {
        if (
          String(product.category) === String(categoryId) &&
          categoryProductMap.has(String(product._id))
        ) {
          return categoryProductsForUpdate[nextCategoryIndex++];
        }
        return product;
      });

      await Product.bulkWrite(
        finalOrder.map((product, index) => ({
          updateOne: {
            filter: { _id: product._id },
            update: { $set: { order: index } },
          },
        }))
      );
    } else {
      await Product.bulkWrite(
        normalizedItems.map(({ id, order }) => ({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(id) },
            update: { $set: { order } },
          },
        }))
      );
    }

    res.status(200).json({
      success: true,
      message: "Product order updated successfully!",
    });
  } catch (err) {
    console.error("Error reordering products:", err);
    res.status(500).json({
      success: false,
      message: "Server error, unable to reorder products",
    });
  }
};

const getHomePageBottomSectionList = async (req, res) => {
  try {
    const products = await Product.find({ homePageBottomSection: true })
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

module.exports = {
  create,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  getHomePageBottomSectionList,
};
