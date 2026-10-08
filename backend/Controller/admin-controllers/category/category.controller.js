const mongoose = require("mongoose");
const Category = require("../../../Models/Category");
const deleteFile = require("../../../utils/deleteFile");
const { destringify } = require("../../../utils/stringify");
const { getUploadedFileName } = require("../../../utils/requestUploads");

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
    const { name, subcategories, filters } = req.body;
    const image = getUploadedFileName(req, "image");

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Category image required",
      });
    }

    // Place new category at the end by finding current max order
    const last = await Category.findOne().sort({ order: -1 }).select("order");
    const nextOrder = last ? last.order + 1 : 0;

    await Category.create({
      name: destringify(name),
      filters: destringify(filters, []),
      subcategories: destringify(subcategories, []),
      image,
      order: nextOrder,
    });

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
    const nextImage = getUploadedFileName(req, "image");

    if (nextImage && nextImage !== category.image) {
      deleteFile(category.image);
      category.image = nextImage;
    }

    category.name = destringify(data.name);
    category.subcategories = destringify(data.subcategories, []);
    category.filters = destringify(data.filters, []);

    await category.save();

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

    res.status(200).json({ message: "Category order updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  addCategory,
  editCategory,
  deleteCategory,
  getCategory,
  getAllCategory,
  reorderCategories,
};
