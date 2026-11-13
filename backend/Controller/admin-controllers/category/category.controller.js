const mongoose = require("mongoose");
const Category = require("../../../Models/Category");
const deleteFile = require("../../../utils/deleteFile");
const { destringify } = require("../../../utils/stringify");
const { getUploadedFileName } = require("../../../utils/requestUploads");
const cache = require("../../../utils/cache");
const { generateUniqueSlug } = require("../../../utils/slugify");
const { generateCategorySchema } = require("../../../utils/schemaGenerator");

const ensureCategoryOrder = async () => {
  const unorderedCategories = await Category.find({
    $or: [{ order: { $exists: false } }, { order: null }],
  })
    .sort({ createdAt: 1, _id: 1 })
    .select("_id")
    .lean();

  if (!unorderedCategories.length) return;

  const lastOrderedCategory = await Category.findOne({
    order: { $ne: null },
  })
    .sort({ order: -1 })
    .select("order")
    .lean();

  const startOrder = Number.isFinite(lastOrderedCategory?.order)
    ? lastOrderedCategory.order + 1
    : 0;

  await Category.bulkWrite(
    unorderedCategories.map((category, index) => ({
      updateOne: {
        filter: { _id: category._id },
        update: { $set: { order: startOrder + index } },
      },
    }))
  );
};

const addCategory = async (req, res) => {
  try {
    const {
      name,
      subcategories,
      filters,
      slug,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogImage,
      seoSchema,
    } = req.body;
    const image = getUploadedFileName(req, "image");

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Category image required",
      });
    }

    const parsedName = destringify(name);
    const categoryNameEn =
      parsedName && typeof parsedName === "object"
        ? parsedName.en || Object.values(parsedName)[0]
        : parsedName || "category";

    const resolvedSlug = await generateUniqueSlug(
      Category,
      slug || categoryNameEn,
      null,
      "category"
    );

    const resolvedMetaTitle =
      metaTitle && String(metaTitle).trim()
        ? String(metaTitle).trim()
        : `${categoryNameEn} | MMMK WODE`;

    const resolvedMetaDescription =
      metaDescription && String(metaDescription).trim()
        ? String(metaDescription).trim()
        : `Explore luxury collections in ${categoryNameEn} at MMMK WODE.`;

    const resolvedCanonicalUrl =
      canonicalUrl && String(canonicalUrl).trim()
        ? String(canonicalUrl).trim()
        : `https://mmmk-wode.com/product-listings?category=${encodeURIComponent(resolvedSlug)}`;

    let resolvedSchema =
      seoSchema !== undefined && String(seoSchema).trim()
        ? String(seoSchema).trim()
        : "";

    if (!resolvedSchema) {
      try {
        resolvedSchema = generateCategorySchema({
          name: parsedName,
          slug: resolvedSlug,
          metaTitle: resolvedMetaTitle,
          metaDescription: resolvedMetaDescription,
          canonicalUrl: resolvedCanonicalUrl,
          image,
        });
      } catch (err) {
        console.error("Auto schema generation failed on addCategory:", err);
      }
    }

    // Place new category at the end by finding current max order
    const last = await Category.findOne().sort({ order: -1 }).select("order");
    const nextOrder = last ? last.order + 1 : 0;

    await Category.create({
      name: parsedName,
      filters: destringify(filters, []),
      subcategories: destringify(subcategories, []),
      image,
      order: nextOrder,
      slug: resolvedSlug,
      metaTitle: resolvedMetaTitle,
      metaDescription: resolvedMetaDescription,
      metaKeywords: metaKeywords ? String(metaKeywords).trim() : undefined,
      canonicalUrl: resolvedCanonicalUrl,
      ogImage: ogImage ? String(ogImage).trim() : undefined,
      seoSchema: resolvedSchema || undefined,
    });

    cache.invalidate("categories");

    res
      .status(201)
      .json({ success: true, message: "Category Created Successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const nextImage = getUploadedFileName(req, "image");

    if (nextImage && nextImage !== category.image) {
      deleteFile(category.image);
      category.image = nextImage;
    }

    category.name = destringify(data.name);
    category.subcategories = destringify(data.subcategories, []);
    category.filters = destringify(data.filters, []);

    const categoryNameEn =
      category.name && typeof category.name === "object"
        ? category.name.en || Object.values(category.name)[0]
        : category.name || "category";

    let resolvedSlug = category.slug;
    if (data.slug !== undefined && String(data.slug).trim()) {
      resolvedSlug = await generateUniqueSlug(
        Category,
        data.slug,
        category._id,
        "category"
      );
    } else if (!resolvedSlug) {
      resolvedSlug = await generateUniqueSlug(
        Category,
        categoryNameEn,
        category._id,
        "category"
      );
    }

    const resolvedMetaTitle =
      data.metaTitle !== undefined && String(data.metaTitle).trim()
        ? String(data.metaTitle).trim()
        : category.metaTitle || `${categoryNameEn} | MMMK WODE`;

    const resolvedMetaDescription =
      data.metaDescription !== undefined && String(data.metaDescription).trim()
        ? String(data.metaDescription).trim()
        : category.metaDescription ||
          `Explore luxury collections in ${categoryNameEn} at MMMK WODE.`;

    const resolvedCanonicalUrl =
      data.canonicalUrl !== undefined && String(data.canonicalUrl).trim()
        ? String(data.canonicalUrl).trim()
        : category.canonicalUrl ||
          `https://mmmk-wode.com/product-listings?category=${encodeURIComponent(resolvedSlug)}`;

    let resolvedSchema =
      data.seoSchema !== undefined && String(data.seoSchema).trim()
        ? String(data.seoSchema).trim()
        : category.seoSchema || "";

    if (!resolvedSchema) {
      try {
        resolvedSchema = generateCategorySchema({
          name: category.name,
          slug: resolvedSlug,
          metaTitle: resolvedMetaTitle,
          metaDescription: resolvedMetaDescription,
          canonicalUrl: resolvedCanonicalUrl,
          image: category.image,
        });
      } catch (err) {
        console.error("Auto schema generation failed on editCategory:", err);
      }
    }

    category.slug = resolvedSlug;
    category.metaTitle = resolvedMetaTitle;
    category.metaDescription = resolvedMetaDescription;
    if (data.metaKeywords !== undefined) category.metaKeywords = data.metaKeywords ? String(data.metaKeywords).trim() : "";
    category.canonicalUrl = resolvedCanonicalUrl;
    if (data.ogImage !== undefined) category.ogImage = data.ogImage ? String(data.ogImage).trim() : "";
    category.seoSchema = resolvedSchema;

    await category.save();

    cache.invalidate("categories");

    res.status(200).json({ message: "Category Updated Successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.findById(id);
    deleteFile(category.image);
    await Category.findByIdAndDelete(id);

    cache.invalidate("categories");

    res.status(200).json({ message: "Category Deleted Successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Category.findById(id);
    res.status(200).json({ message: "Category Fetched Successfully!", data });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllCategory = async (req, res) => {
  try {
    await ensureCategoryOrder();
    let filters = {};
    const {
      searchKey,
      searchValue,
      currentPage = 1,
      pageSize = 10,
    } = req.query;

    if (searchKey && searchValue) {
      if (searchKey === "name") {
        filters["name.en"] = { $regex: searchValue, $options: "i" };
      } else if (searchKey === "subcategoryName") {
        filters.subcategories = {
          $elemMatch: { en: { $regex: searchValue, $options: "i" } },
        };
      }
    }

    // Sort by order field so drag-and-drop positions are persisted
    const data = await Category.find(filters)
      .sort({ order: 1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    const total = await Category.countDocuments(filters);

    res
      .status(200)
      .json({ message: "Category Fetched Successfully!", data, total });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Receives an ordered array of category IDs and updates
 * each document's `order` field to match the new sequence.
 * Body: { orderedIds: ["id1", "id2", "id3", ...] }
 */
const reorderCategories = async (req, res) => {
  try {
    await ensureCategoryOrder();
    const { orderedIds, orderedItems } = req.body;

    const normalizedItems = Array.isArray(orderedItems)
      ? orderedItems
      : Array.isArray(orderedIds)
        ? orderedIds.map((id, index) => ({ id, order: index }))
        : [];

    if (normalizedItems.length === 0) {
      return res.status(400).json({
        message: "orderedItems array is required",
      });
    }

    const bulkOps = normalizedItems.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { order } },
      },
    }));

    await Category.bulkWrite(bulkOps);

    cache.invalidate("categories");

    res.status(200).json({ message: "Category order updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const generateCategorySchemaController = async (req, res) => {
  try {
    const { generateCategorySchema } = require("../../../utils/schemaGenerator");
    const schema = generateCategorySchema(req.body);
    return res.status(200).json({
      success: true,
      message: "Category schema generated successfully",
      schema,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to generate category schema",
    });
  }
};

module.exports = {
  addCategory,
  editCategory,
  deleteCategory,
  getCategory,
  getAllCategory,
  reorderCategories,
  generateCategorySchema: generateCategorySchemaController,
};
