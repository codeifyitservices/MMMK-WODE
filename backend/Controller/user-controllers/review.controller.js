const Review = require("../../Models/Review");
const Order = require("../../Models/Order");

const reviewEligibilityFilter = (userId, productId) => ({
  userId,
  "products.id": productId,
  $or: [{ deliveryStatus: "Delivered" }, { status: "Complete" }],
});

module.exports.addReview = async (req, res) => {
  try {
    const { product, rating, review } = req.body;

    if (!product || !rating || !review) {
      return res.status(404).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const eligibleOrder = await Order.findOne(
      reviewEligibilityFilter(req.user.id, product)
    ).select("_id orderId status deliveryStatus");

    if (!eligibleOrder) {
      return res.status(400).json({
        success: false,
        message:
          "You can only review a product after the order is completed or delivered.",
      });
    }

    const reviewData = new Review({ ...req.body, user: req.user.id });
    await reviewData.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully.",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Failed to add review",
    });
  }
};

module.exports.getEligibility = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product id is required",
      });
    }

    const eligibleOrder = await Order.findOne(
      reviewEligibilityFilter(req.user.id, productId)
    )
      .select("_id orderId status deliveryStatus createdAt deliveryDate")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      canReview: Boolean(eligibleOrder),
      order: eligibleOrder || null,
      message: eligibleOrder
        ? "Product is eligible for review"
        : "You can only review after the order is completed or delivered",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Failed to check review eligibility",
    });
  }
};

module.exports.getByProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const reviews = await Review.find({ product: id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Review fetched successfully.",
      data: reviews,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Failed to add review",
    });
  }
};

module.exports.getAll = async (req, res) => {
  try {
    const {
      searchKey,
      searchValue,
      currentPage = 1,
      pageSize = 10,
    } = req.query;

    const matchStage = {};

    // Build match stage for search
    if (searchKey && searchValue) {
      if (searchKey === "productName") {
        matchStage["product.productName.en"] = {
          $regex: searchValue,
          $options: "i",
        };
      } else if (searchKey === "userName") {
        matchStage["user.firstName"] = { $regex: searchValue, $options: "i" };
      }
    }

    const skip = (parseInt(currentPage) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      Object.keys(matchStage).length > 0 ? { $match: matchStage } : null,
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ].filter(Boolean);

    const result = await Review.aggregate(pipeline);

    const reviews = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    res.status(200).json({
      success: true,
      message: "Review fetched successfully.",
      data: reviews,
      total,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

module.exports.deleteReview = async (req, res) => {
  try {
    const id = req.params.id;
    await Review.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};
