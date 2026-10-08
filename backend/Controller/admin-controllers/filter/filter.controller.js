const Filter = require("../../../Models/filter");
const Product = require("../../../Models/Product");
const Category = require("../../../Models/Category");
const SKU = require("../../../Models/sku");

const addFilters = async (req, res) => {
  try {
    const data = req.body;
    const savedData = await Filter.create(data);
    res.status(201).json({
      success: true,
      message: "Filter created successfully",
      data: savedData,
    });
  } catch (error) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateFilters = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const savedData = await Filter.findByIdAndUpdate(id, data, { new: true });
    res.status(201).json({
      success: true,
      message: "Filter updated successfully",
      data: savedData,
    });
  } catch (error) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteFilter = async (req, res) => {
  try {
    const id = req.params.id;
    const savedData = await Filter.findByIdAndDelete(id);
    res.status(201).json({
      success: true,
      message: "Filter deleted successfully",
      data: savedData,
    });
  } catch (error) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllFilters = async (req, res) => {
  try {
    let filters = {};
    const {
      searchKey,
      searchValue,
      currentPage = 1,
      pageSize = 10,
    } = req.query;

    if (searchKey && searchValue) {
      if (searchKey === "filterName") {
        filters.filterName = { $regex: searchValue, $options: "i" };
      }
    }
    const data = await Filter.find(filters)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    const total = await Filter.countDocuments(filters);

    res.status(200).json({
      success: true,
      message: "Filters fetched successfully",
      data,
      total,
    });
  } catch (error) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllFiltersForUser = async (req, res) => {
  try {
    const { categories = [] } = req.query;
    
    let filterIds = [];
    
    // 1. Get specific filter IDs from selected categories
    if (categories && categories.length > 0) {
      const categoryDocs = await Category.find({ _id: { $in: categories } }).lean();
      const idsSet = new Set();
      categoryDocs.forEach(cat => {
        if (cat.filters && Array.isArray(cat.filters)) {
          cat.filters.forEach(f => {
            if (f._id) idsSet.add(String(f._id));
          });
        }
      });
      filterIds = Array.from(idsSet);
      
      // If categories selected but no filters assigned, return empty
      if (filterIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No filters assigned to selected categories",
          data: [],
        });
      }
    }
    
    // 2. Fetch the specific filter documents
    const filterMatch = filterIds.length > 0 
      ? { _id: { $in: filterIds } }
      : {};
      
    const data = await Filter.find(filterMatch).sort({ createdAt: -1 }).lean();

    const newData = [];

    for (const filter of data) {
      const counts = [];
      const filterNameLower = filter.filterName.toLowerCase();
      const isSkuLevel = ['size', 'color'].includes(filterNameLower);

      if (filter.options && Array.isArray(filter.options)) {
        for (const option of filter.options) {
          let productCount = 0;
          const productBaseQuery = { status: { $ne: "Inactive" } };
          
          if (categories && categories.length > 0) {
            productBaseQuery.category = { $in: categories };
          }

          if (isSkuLevel) {
            // Map common keys to DB casing
            let dbKey = filter.filterName; // Fallback to name in Filter doc
            if (filterNameLower === 'size') dbKey = 'Size';
            if (filterNameLower === 'color') dbKey = 'Color';

            const skuMatch = { [`filters.${dbKey}`]: option };
            const matchingSkuProductIds = await SKU.find(skuMatch).distinct("product");
            
            productBaseQuery._id = { $in: matchingSkuProductIds };
            productCount = await Product.countDocuments(productBaseQuery);
          } else {
            const countQuery = { ...productBaseQuery };
            switch (filter.filterName) {
              case "Price":
                const { from, to } = option;
                countQuery.price = { $gte: from, $lte: to };
                break;
              case "Discount":
                countQuery.discount = { $lte: option };
                break;
              case "Gender":
                countQuery.gender = option;
                break;
              case "Brand":
              case "brand":
                countQuery.brand = option;
                break;
              case "Rating":
              case "rating":
                countQuery.rating = { $gte: option };
                break;
              default:
                const filterKey = filter.filterName.toLowerCase().replace(/\s+/g, '');
                countQuery[filterKey] = option;
                break;
            }
            productCount = await Product.countDocuments(countQuery);
          }
          counts.push(productCount);
        }
      }
      newData.push({ ...filter, counts });
    }

    res.status(200).json({
      success: true,
      message: "Filters fetched successfully",
      data: newData,
    });
  } catch (error) {
    
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllFilters,
  addFilters,
  updateFilters,
  deleteFilter,
  getAllFiltersForUser,
};
