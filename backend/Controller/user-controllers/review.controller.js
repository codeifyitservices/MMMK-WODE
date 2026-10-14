const Review = require("../../Models/Review");
const Order = require("../../Models/Order");
const Product = require("../../Models/Product");

const reviewEligibilityFilter = (userId, productId) => ({
  userId,
  "products.id": productId,
  $or: [{ deliveryStatus: "Delivered" }, { status: "Complete" }],
});

const countWords = (text) => {
  if (!text) return 0;
  return String(text).trim().split(/\s+/).filter(Boolean).length;
};

module.exports.addReview = async (req, res) => {
  try {
    const { product, rating, review } = req.body;

    if (!product || !rating || !review) {
      return res.status(404).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    if (countWords(review) > 100) {
      return res.status(400).json({
        success: false,
        message: "Review cannot exceed 100 words.",
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

module.exports.addAdminReview = async (req, res) => {
  try {
    const { product, rating, review, reviewerName } = req.body;

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product is required.",
      });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5.",
      });
    }

    if (!review || !String(review).trim()) {
      return res.status(400).json({
        success: false,
        message: "Review text is required.",
      });
    }

    if (countWords(review) > 100) {
      return res.status(400).json({
        success: false,
        message: "Review cannot exceed 100 words.",
      });
    }

    const existingProduct = await Product.findById(product);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Selected product does not exist.",
      });
    }

    // Limit check: Maximum 10 admin reviews per product
    const existingAdminCount = await Review.countDocuments({
      product,
      $or: [{ isAdminReview: true }, { user: null }],
    });

    if (existingAdminCount >= 10) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum limit reached. Admin can only add up to 10 reviews per product.",
      });
    }

    const trimmedName =
      reviewerName && String(reviewerName).trim()
        ? String(reviewerName).trim()
        : "Verified Customer";

    const reviewData = new Review({
      product,
      rating: numericRating,
      review: String(review).trim(),
      reviewerName: trimmedName,
      isAdminReview: true,
    });

    await reviewData.save();

    // Also link review to Product if reviews array exists
    try {
      await Product.findByIdAndUpdate(product, {
        $addToSet: { reviews: reviewData._id },
      });
    } catch (linkErr) {
      console.warn("Could not link review to product.reviews array:", linkErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Review added successfully.",
      data: reviewData,
    });
  } catch (err) {
    console.error("Error adding admin review:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add review.",
    });
  }
};

module.exports.updateAdminReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { product, rating, review, reviewerName } = req.body;

    const existingReview = await Review.findById(id);
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    if (product) {
      const existingProduct = await Product.findById(product);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: "Selected product does not exist.",
        });
      }

      if (String(existingReview.product) !== String(product)) {
        // Limit check if moving review to a different product
        const targetAdminCount = await Review.countDocuments({
          product,
          $or: [{ isAdminReview: true }, { user: null }],
        });
        if (targetAdminCount >= 10) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot move review. The selected product already has the maximum limit of 10 reviews.",
          });
        }

        try {
          await Product.findByIdAndUpdate(existingReview.product, {
            $pull: { reviews: existingReview._id },
          });
          await Product.findByIdAndUpdate(product, {
            $addToSet: { reviews: existingReview._id },
          });
        } catch (linkErr) {
          console.warn("Could not re-link product reviews array:", linkErr.message);
        }
        existingReview.product = product;
      }
    }

    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (!numericRating || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be a number between 1 and 5.",
        });
      }
      existingReview.rating = numericRating;
    }

    if (review !== undefined) {
      if (!String(review).trim()) {
        return res.status(400).json({
          success: false,
          message: "Review text cannot be empty.",
        });
      }
      if (countWords(review) > 100) {
        return res.status(400).json({
          success: false,
          message: "Review cannot exceed 100 words.",
        });
      }
      existingReview.review = String(review).trim();
    }

    if (reviewerName !== undefined) {
      existingReview.reviewerName =
        String(reviewerName).trim() || "Verified Customer";
    }

    await existingReview.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      data: existingReview,
    });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to update review.",
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
    const reviews = await Review.find({ product: id })
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Review fetched successfully.",
      data: reviews,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
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
        matchStage.$or = [
          { "user.firstName": { $regex: searchValue, $options: "i" } },
          { "user.lastName": { $regex: searchValue, $options: "i" } },
          { reviewerName: { $regex: searchValue, $options: "i" } },
        ];
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
