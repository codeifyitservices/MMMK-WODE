const assert = require("assert");
const jwt = require("jsonwebtoken");

// 1. Setup require.cache mocks before requiring controller
const MockUser = {
  savedUsers: [],
  findOne: async (query) => {
    return MockUser.savedUsers.find(u => u.email === query.email) || null;
  },
  findById: async (id) => {
    return MockUser.savedUsers.find(u => String(u._id) === String(id)) || null;
  }
};

class MockUserInstance {
  constructor(data) {
    this._id = data._id || "user_" + Math.random().toString(36).substr(2, 9);
    Object.assign(this, data);
  }
  async save() {
    const existing = MockUser.savedUsers.find(u => String(u._id) === String(this._id));
    if (!existing) {
      MockUser.savedUsers.push(this);
    } else {
      Object.assign(existing, this);
    }
    return this;
  }
  toObject() {
    return { ...this };
  }
}
// Add helper to instantiate
MockUser.createInstance = (data) => new MockUserInstance(data);

const mockProducts = [
  {
    _id: "64f000000000000000000001",
    productName: { en: "Test Product" },
    price: 100,
    discount: 0,
    category: "cat-a",
    status: "Active",
    quantity: 10,
    filters: [], // Add empty filters to mock isProductLevelStockSource as true
  }
];

const MockProduct = {
  find: (query) => ({
    select: () => ({
      lean: async () => {
        const ids = new Set((query?._id?.$in || []).map(String));
        return mockProducts.filter((product) => ids.has(String(product._id)));
      },
    }),
  }),
  findById: (id) => {
    const p = mockProducts.find(product => String(product._id) === String(id));
    if (!p) return null;
    const chain = {
      ...p,
      lean: async () => p,
      save: async function() {
        Object.assign(p, this);
      }
    };
    return chain;
  }
};

class MockSkuInstance {
  constructor(data) {
    Object.assign(this, data);
  }
  async save() {
    return this;
  }
}

const MockSku = {
  findOne: (query) => {
    const skuData = query.sku === "SKU-1" ? { sku: "SKU-1", product: "64f000000000000000000001", quantity: 10 } : null;
    if (!skuData) {
      const emptyChain = {
        select: () => emptyChain,
        lean: async () => null,
      };
      return emptyChain;
    }
    const instance = new MockSkuInstance(skuData);
    instance.select = () => instance;
    instance.lean = async () => skuData;
    return instance;
  },
  find: (query) => ({
    lean: async () => []
  })
};

const MockCoupon = {
  findOne: async (query) => {
    return null;
  }
};

const MockOrder = {
  savedOrders: [],
  countDocuments: async () => 0,
  findByIdAndUpdate: async (id, update) => {
    const order = MockOrder.savedOrders.find(o => String(o._id) === String(id) || o.orderId === id);
    if (order) {
      Object.assign(order, update.$set || update);
    }
    return order;
  }
};

class MockOrderInstance {
  constructor(data) {
    this._id = "order_" + Math.random().toString(36).substr(2, 9);
    Object.assign(this, data);
  }
  async save() {
    MockOrder.savedOrders.push(this);
    return this;
  }
}
MockOrder.createInstance = (data) => new MockOrderInstance(data);

// Define Mock Models in cache
require.cache[require.resolve("../Models/User")] = {
  exports: function(data) { return new MockUserInstance(data); }
};
Object.assign(require.cache[require.resolve("../Models/User")].exports, MockUser);

require.cache[require.resolve("../Models/Order")] = {
  exports: function(data) { return new MockOrderInstance(data); }
};
Object.assign(require.cache[require.resolve("../Models/Order")].exports, MockOrder);

require.cache[require.resolve("../Models/Product")] = {
  exports: MockProduct
};
require.cache[require.resolve("../Models/sku")] = {
  exports: MockSku
};
require.cache[require.resolve("../Models/coupon")] = {
  exports: MockCoupon
};

// Mock other utils and services
require.cache[require.resolve("../utils/juraDelivery")] = {
  exports: {
    sendOrderToJura: async () => ({ success: true, trackingNumber: "JURA-TEST-123" }),
    extractJuraOrderId: (res) => res.trackingNumber,
  }
};

require.cache[require.resolve("../utils/couponUsage")] = {
  exports: {
    assertCouponUsableByUser: async () => true,
    recordCouponUsageForOrder: async () => true,
  }
};

require.cache[require.resolve("../services/mailService")] = {
  exports: {
    sendMail: async () => true,
    sendOrderConfirmationEmail: async () => true,
  }
};

// Mock Stripe
let stripePayloadReceived = null;
const stripeMock = () => ({
  paymentIntents: {
    create: async (payload) => {
      stripePayloadReceived = payload;
      return {
        id: "pi_test_apple_pay",
        status: "succeeded",
        amount: payload.amount,
        currency: payload.currency,
      };
    },
  },
});
require.cache[require.resolve("stripe")] = {
  exports: stripeMock,
};

// Mock env variables for test keys
process.env.STRIPE_MODE = "test";
process.env.STRIPE_TEST_SECRET_KEY = "sk_test_12345";
process.env.SECRET_KEY = "test_jwt_secret";

// Import controller
const { confirmApplePayPayment } = require("../Controller/non-auth-controllers/checkout.controller");

const run = async () => {
  console.log("Starting Apple Pay checkout flow tests...");

  // Setup a mock registered user in our database
  const registeredUser = new MockUserInstance({
    _id: "registered_user_123",
    email: "registered@example.com",
    shippingAddresses: [],
    billingAddresses: [],
  });
  MockUser.savedUsers.push(registeredUser);

  const registeredUserToken = jwt.sign({ id: "registered_user_123" }, process.env.SECRET_KEY);

  // ----------------------------------------------------
  // TEST SCENARIO 1: Guest Checkout
  // ----------------------------------------------------
  {
    console.log("Running Scenario 1: Guest Checkout...");
    const req = {
      headers: {},
      cookies: {},
      body: {
        paymentMethodId: "pm_apple_pay_test_guest",
        email: "guest@example.com",
        shippingAddress: {
          firstName: "Guest",
          lastName: "User",
          streetAddress: "123 Guest Way",
          city: "Dubai",
          state: "Dubai",
          postalCode: "00000",
          country: "AE",
          phoneNumber: "+971500000001",
        },
        billingAddress: {
          firstName: "Guest",
          lastName: "User",
          streetAddress: "123 Guest Way",
          city: "Dubai",
          state: "Dubai",
          postalCode: "00000",
          country: "AE",
          phoneNumber: "+971500000001",
        },
        deliveryFee: 10,
        products: [
          {
            product: "64f000000000000000000001",
            quantity: 1,
            sku: "SKU-1",
          }
        ],
        currency: "AED",
        currencyRate: 3.67,
      }
    };

    let resStatus = 200;
    let resJsonData = null;

    const res = {
      status: (code) => {
        resStatus = code;
        return res;
      },
      json: (data) => {
        resJsonData = data;
        return res;
      }
    };

    await confirmApplePayPayment(req, res);

    assert.strictEqual(resStatus, 200, `Expected status 200, got ${resStatus}`);
    assert.ok(resJsonData.success, "Expected success to be true");
    assert.ok(stripePayloadReceived, "Expected Stripe to receive payload");
    assert.strictEqual(stripePayloadReceived.amount, 38037);
  }

  // ----------------------------------------------------
  // TEST SCENARIO 2: Registered User Checkout & Address Autofil Save
  // ----------------------------------------------------
  {
    console.log("Running Scenario 2: Registered User Checkout (Address Book Save)...");
    const req = {
      headers: {
        authorization: `Bearer ${registeredUserToken}`
      },
      cookies: {},
      body: {
        paymentMethodId: "pm_apple_pay_test_registered",
        email: "registered@example.com",
        shippingAddress: {
          firstName: "Registered",
          lastName: "Owner",
          streetAddress: "456 Residence Ave",
          city: "Dubai",
          state: "Dubai",
          postalCode: "11111",
          country: "AE",
          phoneNumber: "+971509999999",
        },
        billingAddress: {
          firstName: "Registered",
          lastName: "Owner",
          streetAddress: "456 Residence Ave",
          city: "Dubai",
          state: "Dubai",
          postalCode: "11111",
          country: "AE",
          phoneNumber: "+971509999999",
        },
        deliveryFee: 15,
        products: [
          {
            product: "64f000000000000000000001",
            quantity: 1,
            sku: "SKU-1",
          }
        ],
        currency: "AED",
        currencyRate: 3.67,
      }
    };

    let resStatus = 200;
    let resJsonData = null;

    const res = {
      status: (code) => {
        resStatus = code;
        return res;
      },
      json: (data) => {
        resJsonData = data;
        return res;
      }
    };

    await confirmApplePayPayment(req, res);

    // Verify response
    assert.strictEqual(resStatus, 200, `Expected status 200, got ${resStatus}`);
    assert.ok(resJsonData.success, "Expected success to be true");

    // Verify Stripe amount with new 15 AED deliveryFee:
    // Product price: 100 USD -> 370.37 AED.
    // Delivery Fee: 15 AED.
    // Total: 385.37 AED -> 38537 fils.
    assert.strictEqual(stripePayloadReceived.amount, 38537, `Expected 38537, got ${stripePayloadReceived.amount}`);

    // Verify the registered user's address book got populated with the Apple Pay address!
    const updatedUser = MockUser.savedUsers.find(u => u._id === "registered_user_123");
    assert.ok(updatedUser, "Registered user should exist in database");
    assert.strictEqual(updatedUser.shippingAddresses.length, 1, "Should have saved shipping address to address book");
    assert.strictEqual(updatedUser.shippingAddresses[0].street_address, "456 Residence Ave", "Saved address should match");
    assert.strictEqual(updatedUser.billingAddresses.length, 1, "Should have saved billing address to address book");
    assert.strictEqual(updatedUser.billingAddresses[0].street_address, "456 Residence Ave", "Saved billing address should match");
  }

  console.log("PASS: All Apple Pay checkout flow tests completed successfully.");
};

run().catch(err => {
  console.error("FAIL: Apple Pay checkout flow test failed:", err);
  process.exit(1);
});
