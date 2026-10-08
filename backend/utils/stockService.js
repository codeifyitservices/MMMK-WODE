const Product = require("../Models/Product");
const SKU = require("../Models/sku");

const isProductLevelStockSource = (product) =>
  Array.isArray(product?.filters) && product.filters.length === 0;

const getAvailableStockForItem = async ({ productId = null, sku = "" } = {}) => {
  if (sku) {
    const skuDoc = await SKU.findOne({ sku }).lean();
    if (!skuDoc) {
      throw new Error(`SKU not found: ${sku}`);
    }

    const product = skuDoc.product
      ? await Product.findById(skuDoc.product).lean()
      : null;
    const effectiveQuantity =
      product && isProductLevelStockSource(product)
        ? Number(product.quantity || 0)
        : Number(skuDoc.quantity || 0);

    return {
      productId: skuDoc.product ? String(skuDoc.product) : productId,
      sku,
      quantity: effectiveQuantity,
    };
  }

  if (!productId) {
    throw new Error("Product ID or SKU is required");
  }

  const product = await Product.findById(productId).lean();
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  return {
    productId: String(product._id),
    sku: "",
    quantity: Number(product.quantity || 0),
  };
};

const normalizeItems = (items = []) =>
  items
    .map((item) => ({
      productId: item?.productId || item?.id || null,
      sku: item?.sku || "",
      quantity: Number(item?.quantity || 0),
      name: item?.name || "Product",
    }))
    .filter((item) => item.quantity > 0 && (item.productId || item.sku));

const updateProductStatusFromQuantity = (product) => {
  if (!product) return;
  if (product.quantity <= 0) {
    product.quantity = 0;
    if (product.status !== "Inactive") product.status = "Out of stock";
    return;
  }
  if (product.status === "Out of stock") {
    product.status = "Active";
  }
};

const recalculateProductQuantityFromSkus = async (productId) => {
  if (!productId) return;
  const skus = await SKU.find({ product: productId }).lean();
  if (!skus.length) return;

  const totalQuantity = skus.reduce(
    (sum, sku) => sum + Number(sku?.quantity || 0),
    0
  );
  const product = await Product.findById(productId);
  if (!product) return;

  product.quantity = totalQuantity;
  updateProductStatusFromQuantity(product);
  await product.save();
};

const validateStockAvailability = async (items = []) => {
  const normalizedItems = normalizeItems(items);

  for (const item of normalizedItems) {
    if (item.sku) {
      const stock = await getAvailableStockForItem({
        productId: item.productId,
        sku: item.sku,
      });
      if (stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for SKU ${item.sku}`);
      }
      continue;
    }

    const product = await Product.findById(item.productId).lean();
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    if (Number(product.quantity || 0) < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }
  }
};

const applyStockChangeForItems = async ({ items = [], direction }) => {
  if (![1, -1].includes(direction)) {
    throw new Error("Direction must be 1 (restock) or -1 (deduct)");
  }

  const normalizedItems = normalizeItems(items);
  const productsToRecalculate = new Set();

  for (const item of normalizedItems) {
    if (item.sku) {
      const skuDoc = await SKU.findOne({ sku: item.sku });
      if (!skuDoc) {
        throw new Error(`SKU not found: ${item.sku}`);
      }
      const productDoc = skuDoc.product ? await Product.findById(skuDoc.product) : null;

      if (productDoc && isProductLevelStockSource(productDoc)) {
        const nextProductQuantity =
          Number(productDoc.quantity || 0) + direction * item.quantity;
        if (direction < 0 && nextProductQuantity < 0) {
          throw new Error(`Insufficient stock for SKU ${item.sku}`);
        }

        productDoc.quantity = Math.max(0, nextProductQuantity);
        updateProductStatusFromQuantity(productDoc);
        await productDoc.save();

        skuDoc.quantity = productDoc.quantity;
        await skuDoc.save();
        continue;
      }

      const nextQuantity = Number(skuDoc.quantity || 0) + direction * item.quantity;
      if (direction < 0 && nextQuantity < 0) {
        throw new Error(`Insufficient stock for SKU ${item.sku}`);
      }

      skuDoc.quantity = Math.max(0, nextQuantity);
      await skuDoc.save();
      if (skuDoc.product) productsToRecalculate.add(String(skuDoc.product));
      continue;
    }

    const productDoc = await Product.findById(item.productId);
    if (!productDoc) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const nextQuantity = Number(productDoc.quantity || 0) + direction * item.quantity;
    if (direction < 0 && nextQuantity < 0) {
      throw new Error(`Insufficient stock for product ${item.productId}`);
    }

    productDoc.quantity = Math.max(0, nextQuantity);
    updateProductStatusFromQuantity(productDoc);
    await productDoc.save();
  }

  for (const productId of productsToRecalculate) {
    await recalculateProductQuantityFromSkus(productId);
  }
};

const deductStockForOrder = async (order) => {
  await applyStockChangeForItems({
    items: order?.products || [],
    direction: -1,
  });
};

const restockItems = async (items) => {
  await applyStockChangeForItems({ items, direction: 1 });
};

const deductItems = async (items) => {
  await applyStockChangeForItems({ items, direction: -1 });
};

module.exports = {
  deductStockForOrder,
  restockItems,
  deductItems,
  validateStockAvailability,
  getAvailableStockForItem,
};
