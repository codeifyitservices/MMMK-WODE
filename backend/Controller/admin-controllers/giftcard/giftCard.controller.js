const GiftCard = require("../../../Models/GiftCard");
const { createGiftCardCodeAndPassword } = require("../../../services/giftCard");

module.exports.addGiftCard = async (req, res) => {
  try {
    const { name, code, amount, status, password: providedPassword } = req.body;

    if (!name || !amount || !status) {
      return res.status(404).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (code) {
      const existingGiftCard = await GiftCard.findOne({ code });

      if (existingGiftCard) {
        return res.status(400).json({
          success: false,
          message: "Gift card with this code already exists",
        });
      }
    }

    const { code: generatedCode, password: generatedPassword } =
      await createGiftCardCodeAndPassword();

    const giftCard = new GiftCard({
      name,
      code: code || generatedCode,
      password: providedPassword || generatedPassword,
      amount,
      status,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    });

    await giftCard.save();

    res.status(201).json({
      success: true,
      message: "Gift card added successfully",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add gift card",
    });
  }
};

module.exports.updateGiftCard = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, amount, status } = req.body;

    if (!name || !amount || !status) {
      return res.status(404).json({
        success: false,
        message: "All fields are required",
      });
    }

    const updatedGiftCard = await GiftCard.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.status(201).json({
      success: true,
      message: "Gift card updated successfully",
      data: updatedGiftCard,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add gift card",
    });
  }
};

module.exports.deleteGiftCard = async (req, res) => {
  try {
    const id = req.params.id;

    await GiftCard.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Gift card deleted successfully",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add gift card",
    });
  }
};

module.exports.getAll = async (req, res) => {
  try {
    let filters = {};
    const {
      searchKey,
      searchValue,
      currentPage = 1,
      pageSize = 10,
    } = req.query;

    if (searchKey && searchValue) {
      if (searchKey === "name") {
        filters.name = { $regex: searchValue, $options: "i" };
      }
      if (searchKey === "code") {
        filters.code = { $regex: searchValue, $options: "i" };
      }
    }
    const data = await GiftCard.find(filters)
      .populate([
        { path: "redeemedBy", select: "firstName lastName email" },
        { path: "createdBy", select: "firstName lastName email" },
      ])
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    const total = await GiftCard.countDocuments(filters);

    res.status(200).json({
      success: true,
      message: "Gift cards fetched successfully",
      data,
      total,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add gift card",
    });
  }
};

module.exports.getActive = async (req, res) => {
  try {
    const data = await GiftCard.find({ status: "Active" })
      .populate("redeemedBy")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      message: "Gift card feteched successfully",
      data,
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: err.message || "Failed to add gift card",
    });
  }
};
