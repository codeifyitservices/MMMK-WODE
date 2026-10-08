const assert = require("assert");

const Product = require("../Models/Product");
const Coupon = require("../Models/coupon");
const SKU = require("../Models/sku");
const Order = require("../Models/Order");
const {
  CheckoutAmountMismatchError,
  buildCheckoutCalculation,
} = require("../utils/checkoutCalculator");

const products = [
  {
    _id: "64f000000000000000000001",
    productName: { en: "Integrity Product" },
    price: 100,
    discount: 0,
    category: "cat-a",
    status: "Active",
  },
  {
    _id: "64f000000000000000000002",
    productName: { en: "Discounted Product" },
    price: 50,
    discount: 10,
    category: "cat-b",
    status: "Active",
  },
];

const coupons = {
  TENOFF: {
    couponCode: "TENOFF",
    discount: 10,
    discountType: "percentage",
    applyToProducts: true,
    applyToDelivery: false,
    scope: "All",
    perUserLimit: 999,
    maxUsage: null,
    currentUsage: 0,
  },
  SHIP5: {
    couponCode: "SHIP5",
    discount: 0,
    discountType: "percentage",
    applyToProducts: false,
    applyToDelivery: true,
    deliveryDiscount: 5,
    deliveryDiscountType: "amount",
    scope: "All",
    perUserLimit: 999,
    maxUsage: null,
    currentUsage: 0,
  },
};

Product.find = (query) => ({
  select: () => ({
    lean: async () => {
      const ids = new Set((query?._id?.$in || []).map(String));
      return products.filter((product) => ids.has(String(product._id)));
    },
  }),
});

SKU.findOne = () => ({
  select: () => ({
    lean: async () => ({ sku: "SKU-1" }),
  }),
});

Coupon.findOne = async (query) => coupons[query?.couponCode] || null;
Order.countDocuments = async () => 0;

const user = { credits: 500 };
const productLine = (productId, quantity = 1) => ({
  product: { _id: productId },
  quantity,
  sku: "SKU-1",
});

const run = async () => {
  {
    const result = await buildCheckoutCalculation({
      body: {
        products: [productLine(products[0]._id)],
        currency: "USD",
        creditsUsed: 100,
        creditsUsedBase: 100,
        totalAmount: 0,
      },
      user,
      userId: "user-1",
    });

    assert.equal(result.base.payableTotal, 0);
    assert.equal(result.base.creditApplied, 100);
    assert.equal(result.minor.stripe, 0);
  }

  {
    const result = await buildCheckoutCalculation({
      body: {
        products: [productLine(products[0]._id)],
        currency: "AED",
        currencyRate: 3.67,
        shippingCharges: 10,
        couponCode: "TENOFF",
        creditsUsed: 183.5,
        creditsUsedBase: 50,
        totalAmount: 183.5,
      },
      user,
      userId: "user-1",
    });

    assert.equal(result.base.subtotal, 100);
    assert.equal(result.base.shippingCharges, 10);
    assert.equal(result.base.couponDiscount, 10);
    assert.equal(result.base.creditApplied, 50);
    assert.equal(result.base.payableTotal, 50);
    assert.equal(result.minor.stripe, 18350);
  }

  {
    const result = await buildCheckoutCalculation({
      body: {
        products: [productLine(products[0]._id)],
        currency: "USD",
        shippingCharges: 20,
        couponCode: "SHIP5",
        creditsUsed: 0,
        creditsUsedBase: 0,
        totalAmount: 115,
      },
      user,
      userId: "user-1",
    });

    assert.equal(result.base.shippingCharges, 20);
    assert.equal(result.base.couponDiscount, 5);
    assert.equal(result.base.payableTotal, 115);
  }

  {
    await assert.rejects(
      () =>
        buildCheckoutCalculation({
          body: {
            products: [productLine(products[0]._id)],
            currency: "USD",
            totalAmount: 1,
          },
          user,
          userId: "user-1",
        }),
      CheckoutAmountMismatchError,
    );
  }

  {
    const result = await buildCheckoutCalculation({
      body: {
        products: [
          {
            product: { _id: "gift-card" },
            quantity: 1,
            sku: "gift-card",
          },
        ],
        orderType: "gift-card",
        giftCardPurchase: { name: "Gift", amount: 830 },
        currency: "INR",
        currencyRate: 83,
        totalAmount: 830,
      },
      user,
      userId: "user-1",
      isGiftCardOrder: true,
    });

    assert.equal(result.currencyCode, "INR");
    assert.equal(result.base.subtotal, 10);
    assert.equal(result.minor.stripe, 83000);
  }

  console.log("PASS checkout calculator integrity checks");
};

run().catch((error) => {
  console.error("FAIL checkout calculator integrity checks", error);
  process.exit(1);
});
