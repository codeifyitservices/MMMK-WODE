const mongoose = require("mongoose");

const wishListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

const WishList = mongoose.model("WishList", wishListSchema);

module.exports = WishList;
