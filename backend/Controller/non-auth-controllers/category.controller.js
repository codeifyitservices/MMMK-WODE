const Category = require("../../Models/Category");
const { searchCatalog } = require("../../services/searchService");

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

const getAllCategory = async (req, res) => {
  try {
    await ensureCategoryOrder();
    const id = req.params.id;
    const data = await Category.find({}).sort({ order: 1, createdAt: 1 });
    res.status(200).json({ message: "Category Fetched Successfully!", data });
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
