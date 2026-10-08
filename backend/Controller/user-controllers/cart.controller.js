const Cart = require("../../Models/Cart");
const mongoose = require("mongoose");
const {
  getAvailableStockForItem,
  validateStockAvailability,
} = require("../../utils/stockService");
const { trackCartActivity } = require("../../services/abandonedCartService");

const normalizeQuantity = (value) => Number(value || 0);

const buildCartItemPayload = (item = {}) => ({
  product: item?.product?._id || item?.product || null,
  sku: String(item?.sku || "").trim(),
  filters: item?.filters || {},
  quantity: normalizeQuantity(item?.quantity),
  bags: normalizeQuantity(item?.bags),
});

const validateCartPayload = async ({ product, sku, quantity }) => {
  if (!product) {
    return "Product not found";
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return "Quantity must be greater than 0";
  }

  try {
    await validateStockAvailability([{ productId: product, sku, quantity }]);
    return null;
  } catch (error) {
    return error.message;
  }
};

const addCartItem = async (req, res) => {
  try {
    
    const user = req.user._id;
    const { product, sku, filters, quantity, bags } = buildCartItemPayload(req.body);
    
    

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const validationError = await validateCartPayload({ product, sku, quantity });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const isProductAdd = await Cart.findOne({ product, sku, user });
    if (isProductAdd) {
      const nextQuantity = Number(isProductAdd.quantity || 0) + quantity;
      const nextBags = Number(isProductAdd.bags || 0) + bags;
      const stock = await getAvailableStockForItem({ productId: product, sku });
      if (nextQuantity > stock.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${stock.quantity} item(s) available for selected option`,
        });
      }

      const updatedCart = await Cart.findByIdAndUpdate(
        isProductAdd._id,
        { quantity: nextQuantity, bags: nextBags, filters },
        { new: true }
      );
      trackCartActivity(user).catch(() => {});
      return res.status(200).json({
        success: true,
        message: "Item quantity updated successfully",
        data: updatedCart,
      });
    } else {
      const data = await Cart.create({ product, sku, filters, user, quantity, bags });
      trackCartActivity(user).catch(() => {});
      res.status(201).json({
        success: true,
        message: "Item added to cart successfully",
        data,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to add item in cart",
      error: err.message, // Include the error message for more details
    });
  }
};

const getCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const objectId = new mongoose.Types.ObjectId(userId);

    const data = await Cart.find({ user: objectId }).populate("product");

    res.status(200).json({
      success: true,
      message: "Cart items fetched successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to get cart items",
    });
  }
};

const setCartItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items } = req.body;
    const objectId = new mongoose.Types.ObjectId(userId);
    const normalizedItems = Array.isArray(items) ? items.map(buildCartItemPayload) : [];
    const mergedItems = normalizedItems.reduce((acc, item) => {
      const key = `${item.product}:${item.sku}`;
      if (!acc[key]) {
        acc[key] = { ...item };
        return acc;
      }
      acc[key].quantity += item.quantity;
      acc[key].bags += item.bags;
      return acc;
    }, {});

    for (const item of Object.values(mergedItems)) {
      const validationError = await validateCartPayload(item);
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }
    }

    await Cart.deleteMany({ user: objectId });
    const sanitizedItems = Object.values(mergedItems);
    const data = sanitizedItems.length
      ? await Cart.insertMany(sanitizedItems.map((item) => ({ ...item, user: objectId })))
      : [];

    trackCartActivity(userId).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Cart items set successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to set cart items",
    });
  }
};

const saveForLater = async (req, res) => {
  try {
    const userId = req.user._id;
    const cartId = req.params.id;

    if (!userId || !cartId) {
      return res.status(400).json({
        success: false,
        message: "Missing credentials",
      });
    }

    const cartItem = await Cart.findByIdAndUpdate(
      cartId,
      { type: "Inactive" },
      { new: true }
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    trackCartActivity(userId).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Item saved for later successfully",
      data: cartItem,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to save item for later",
    });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const id = req.user._id;
    const { quantity = 0, sku } = req.query || {};
    const productId = req.params.id;
    const foundCart = await Cart.findOne({ user: id, product: productId, sku });
    if (!foundCart) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }
    const quantityToRemove = quantity > 0 ? quantity : foundCart.quantity;
    if (foundCart.quantity > quantityToRemove) {
      foundCart.quantity -= quantityToRemove;
      await foundCart.save();
      trackCartActivity(id).catch(() => {});
      return res.status(200).json({
        success: true,
        message: "Cart item quantity updated successfully",
      });
    } else {
      await Cart.findByIdAndDelete(foundCart._id);
      trackCartActivity(id).catch(() => {});
      res.status(201).json({
        success: true,
        message: "Cart item deleted successfully",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to remove cart item",
    });
  }
};

module.exports = {
  addCartItem,
  getCartItem,
  setCartItems,
  removeCartItem,
  saveForLater,
};
