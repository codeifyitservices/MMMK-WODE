const WishList = require("../../Models/WishList.js");

const addWishList = async (req, res) => {
  try {
    const { productId, userId } = req.body;

    const wishList = await WishList.findOneAndUpdate(
      { userId },
      { $addToSet: { products: productId } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Product added to wishlist successfully",
      data: wishList,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const removeWishList = async (req, res) => {
  try {
    const { productId, userId } = req.body;

    const wishList = await WishList.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: productId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: wishList,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getWishLists = async (req, res) => {
  try {
    const userId = req.params.id;

    const wishList = await WishList.findOne({ userId }).populate("products");

    res.status(200).json({
      success: true,
      message: "Whishlist fetched successfully",
      data: wishList,
    });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { addWishList, removeWishList, getWishLists };
