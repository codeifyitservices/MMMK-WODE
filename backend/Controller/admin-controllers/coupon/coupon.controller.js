const Coupon = require("../../../Models/coupon");
const { assertCouponUsableByUser } = require("../../../utils/couponUsage");

const createCoupon = async (req, res) => {
  try {
    const data = await req.body;
    const coupon = await Coupon.findOne({ couponCode: data.couponCode });

    if (coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon code already used",
      });
    }

    const savedData = await Coupon.create(data);

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: savedData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAllCoupon = async (req, res) => {
  try {
    let filters = {};
    const {
      searchKey,
      searchValue,
      currentPage = 1,
      pageSize = 10,
    } = req.query;

    if (searchKey && searchValue) {
      switch (searchKey) {
        case "couponName":
          filters.couponName = { $regex: searchValue, $options: "i" };
          break;
        case "couponCode":
          filters.couponCode = { $regex: searchValue, $options: "i" };
          break;
      }
    }

    const data = await Coupon.find(filters)
      .populate("scopeCategory")
      .populate("scopeProduct")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    const total = await Coupon.countDocuments(filters);

    res.status(201).json({
      success: true,
      message: "Coupon fetched successfully",
      data,
      total,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getValidToken = async (req, res) => {
  try {
    const data = await Coupon.find({
      expiryDate: { $gt: new Date() },
      showToUsers: { $ne: false },
    })
      .populate("scopeCategory")
      .populate("scopeProduct");
    res.status(201).json({
      success: true,
      message: "Valid coupon fetched successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    await Coupon.findByIdAndDelete(id);
    res.status(201).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;

    const existingCoupon = await Coupon.findOne({ 
      couponCode: data.couponCode, 
      _id: { $ne: id } 
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already in use by another coupon",
      });
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(id, data, { new: true });

    if (!updatedCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: updatedCoupon,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const coupon = await Coupon.findOne({ couponCode })
      .populate("scopeCategory")
      .populate("scopeProduct");

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }
    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    let userIdToCheck = req.user?.id;
    if (!userIdToCheck && req.body.guestEmail) {
      const User = require("../../../Models/User");
      const userByEmail = await User.findOne({ email: req.body.guestEmail.toLowerCase() });
      if (userByEmail) {
        userIdToCheck = userByEmail._id;
      }
    }

    if (userIdToCheck) {
      try {
        await assertCouponUsableByUser(coupon, userIdToCheck);
      } catch (error) {
        return res.status(error.statusCode || 400).json({
          success: false,
          message: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      data: coupon,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = { createCoupon, getAllCoupon, deleteCoupon, updateCoupon, getValidToken, applyCoupon };
