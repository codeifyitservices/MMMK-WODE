const Category = require("../../Models/Category");
const { searchCatalog } = require("../../services/searchService");
const cache = require("../../utils/cache");

let hasEnsuredCategoryOrder = false;
const ensureCategoryOrderOnce = async () => {
  if (hasEnsuredCategoryOrder) return;
  try {
    const unorderedCategories = await Category.find({
      $or: [{ order: { $exists: false } }, { order: null }],
    })
      .sort({ createdAt: 1, _id: 1 })
      .select("_id")
      .lean();

    if (!unorderedCategories.length) {
      hasEnsuredCategoryOrder = true;
      return;
    }

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
    hasEnsuredCategoryOrder = true;
  } catch (e) {
    // Non-fatal
  }
};

const getAllCategory = async (req, res) => {
  try {
    const cached = cache.get("categories_all");
    if (cached) {
      return res.status(200).json(cached);
    }

    await ensureCategoryOrderOnce();
    const data = await Category.find({}).sort({ order: 1, createdAt: 1 }).lean();
    const payload = { message: "Category Fetched Successfully!", data };
    cache.set("categories_all", payload, 600); // 10 min TTL
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const searchCategory = async (req, res) => {
  try {
    const { q } = req.query;
    const { suggestions } = await searchCatalog(q, {
      includeCategories: true,
      includeProducts: true,
      suggestionLimit: 10,
      productLimit: 10,
    });

    res.status(200).json({
      message: "Category Fetched Successfully!",
      data: suggestions,
    });
  } catch (err) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllCategory,
  searchCategory,
};
