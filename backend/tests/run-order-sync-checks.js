const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

const projectRoot = path.resolve(__dirname, "..");

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

const requireWithMocks = (targetPath, mocks) => {
  const originalLoad = Module._load;
  const resolvedTarget = require.resolve(targetPath);

  delete require.cache[resolvedTarget];

  Module._load = function mockedLoad(request, parent, isMain) {
    if (Object.prototype.hasOwnProperty.call(mocks, request)) {
      return mocks[request];
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return require(resolvedTarget);
  } finally {
    Module._load = originalLoad;
  }
};

const loadJuraDelivery = ({
  axiosOverrides = {},
  configOverrides = {},
  skuOverrides = {},
  currencyOverrides = {},
} = {}) =>
  requireWithMocks(path.join(projectRoot, "utils", "juraDelivery.js"), {
    axios: {
      post: async () => ({ data: { success: true } }),
      put: async () => ({ data: { success: true } }),
      ...axiosOverrides,
    },
    "./juraConfig": {
      getJuraConfig: () => ({
        baseUrl: "https://juraa.co/api/rest/v1/",
        orderUrl: "",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "test-key",
        },
        ...configOverrides,
      }),
    },
    "../Models/sku": {
      findOne() {
        return {
          select() {
            return this;
          },
          lean: async () => null,
        };
      },
      ...skuOverrides,
    },
    "./currency": {
      resolveCurrencyCode: (value) => value || "AED",
      ...currencyOverrides,
    },
  });

const loadAdminOrderController = ({
  orderDocument,
  sendOrderUpdateImpl = async () => ({ success: true }),
  stockServiceOverrides = {},
  productOverrides = {},
} = {}) => {
  const orderState = {
    current: JSON.parse(JSON.stringify(orderDocument)),
  };

  const OrderMock = {
    async create(data) {
      return data;
    },
    findById(id) {
      const clone = JSON.parse(JSON.stringify(orderState.current));
      return {
        ...clone,
        populate() {
          return this;
        },
      };
    },
    async findByIdAndUpdate(id, update) {
      const patch = update?.$set ? update.$set : update;
      orderState.current = {
        ...orderState.current,
        ...patch,
      };

      return JSON.parse(JSON.stringify(orderState.current));
    },
  };

  const controller = requireWithMocks(
    path.join(
      projectRoot,
      "Controller",
      "admin-controllers",
      "order",
      "order.controller.js"
    ),
    {
      "../../../Models/Order": OrderMock,
      "../../../utils/juraDelivery": {
        sendOrderToJura: async () => ({ success: true }),
        extractJuraOrderId: () => "JURA-1",
        sendOrderUpdateToJura: sendOrderUpdateImpl,
      },
      "../../../utils/juraReturnExchange": {
        sendReturnExchangeToJura: async () => ({ success: true }),
        extractJuraActionId: () => "ACTION-1",
      },
      "../../../utils/stockService": {
        restockItems: async () => undefined,
        deductItems: async () => undefined,
        validateStockAvailability: async () => undefined,
        ...stockServiceOverrides,
      },
      "../../../Models/Product": {
        findById() {
          return {
            select() {
              return this;
            },
            lean: async () => ({ productName: { en: "Resolved Product" } }),
          };
        },
        ...productOverrides,
      },
      "../../../utils/localization": {
        localizeValue: (value) => value?.en || "",
      },
    }
  );

  return { controller, orderState };
};

const checks = [
  {
    name: "build create payload matches Jura schema",
    async run() {
      const { buildJuraPayload } = loadJuraDelivery();
      const payload = await buildJuraPayload({
        orderId: "ORD-UAE-2025-000987",
        paymentStatus: "Paid",
        currency: "AED",
        shippingAddress: {
          firstName: "Ahmed",
          lastName: "Al Mansoori",
          phone: "+971501234567",
          addressLine1: "Villa 23, Street 45",
          city: "Dubai",
          state: "Dubai",
          country: "United Arab Emirates",
        },
        products: [
          {
            sku: "SKU-TSHIRT-WHITE-M",
            name: "White T-Shirt (Medium)",
            quantity: 2,
            amount: 200,
          },
        ],
        price: {
          subtotal: 200,
          total: 200,
        },
      });

      assert.deepEqual(payload, {
        orderReferenceNumber: "ORD-UAE-2025-000987",
        deliveryType: "Next Day",
        shippingAddress: {
          name: "Ahmed Al Mansoori",
          phone: "501234567",
          telephoneCode: "+971",
          addressLine1: "Villa 23, Street 45",
          postalCode: "",
          city: "Dubai",
          state: "Dubai",
          country: "United Arab Emirates",
          stateCode: "DU",
          countryCode: "AE",
        },
        lineItems: [
          {
            skuId: "SKU-TSHIRT-WHITE-M",
            sku: "SKU-TSHIRT-WHITE-M",
            productName: "White T-Shirt (Medium)",
            quantity: 2,
            price: 100,
            amount: 200,
          },
        ],
        amount: {
          currency: "AED",
          subTotal: 200,
          total: 200,
          paymentType: "Paid",
        },
      });
    },
  },
  {
    name: "build create payload rejects missing sku",
    async run() {
      const { buildJuraPayload } = loadJuraDelivery();

      await assert.rejects(
        () =>
          buildJuraPayload({
            orderId: "ORD-1",
            shippingAddress: { country: "United Arab Emirates", state: "Dubai" },
            products: [{ name: "White T-Shirt", quantity: 1, amount: 100 }],
            price: { subtotal: 100, total: 100 },
          }),
        /Missing SKU/
      );
    },
  },
  {
    name: "build update payload uses current order items",
    async run() {
      const { buildJuraUpdatePayload } = loadJuraDelivery();
      const payload = await buildJuraUpdatePayload({
        orderId: "ORD-1",
        paymentStatus: "Paid",
        currency: "AED",
        products: [
          {
            sku: "SKU-NEW",
            name: "Updated Product",
            quantity: 1,
            amount: 150,
          },
        ],
        price: {
          subtotal: 150,
          total: 150,
        },
        temp: {
          juraResponse: {
            data: {
              lineItems: [
                {
                  skuId: "SKU-OLD",
                  sku: "SKU-OLD",
                  productName: "Old Product",
                  quantity: 1,
                  price: 99,
                  amount: 99,
                },
              ],
            },
          },
        },
      });

      assert.equal(payload.lineItems[0].sku, "SKU-NEW");
      assert.equal(payload.amount.total, 150);
    },
  },
  {
    name: "extract order id reads order number response",
    async run() {
      const { extractJuraOrderId } = loadJuraDelivery();
      assert.equal(
        extractJuraOrderId({
          data: { orderNumber: "ORD-RESP-1001" },
        }),
        "ORD-RESP-1001"
      );
    },
  },
  {
    name: "admin update syncs edited order state to Jura",
    async run() {
      const juraRequests = [];
      const stockCalls = {
        validate: [],
        restock: [],
        deduct: [],
      };

      const existingOrder = {
        _id: "order-1",
        orderId: "ORD-1",
        status: "Pending",
        deliveryStatus: "Pending",
        paymentStatus: "Pending",
        stockAdjusted: true,
        amount: 100,
        totalQuantity: 1,
        price: {
          subtotal: 100,
          shippingCharges: 10,
          discount: 0,
          tax: 0,
          extraCharges: 0,
          couponDiscount: 0,
          creditApplied: 0,
          total: 110,
        },
        products: [
          {
            id: "product-1",
            sku: "SKU-OLD",
            name: "Old Product",
            quantity: 1,
            amount: 100,
          },
        ],
        temp: {
          juraResponse: {
            data: {
              lineItems: [
                {
                  skuId: "SKU-OLD",
                  sku: "SKU-OLD",
                  productName: "Old Product",
                  quantity: 1,
                  price: 100,
                  amount: 100,
                },
              ],
            },
          },
        },
      };

      const { controller, orderState } = loadAdminOrderController({
        orderDocument: existingOrder,
        sendOrderUpdateImpl: async (order) => {
          juraRequests.push(JSON.parse(JSON.stringify(order)));
          return { success: true };
        },
        stockServiceOverrides: {
          async validateStockAvailability(items) {
            stockCalls.validate.push(JSON.parse(JSON.stringify(items)));
          },
          async restockItems(items) {
            stockCalls.restock.push(JSON.parse(JSON.stringify(items)));
          },
          async deductItems(items) {
            stockCalls.deduct.push(JSON.parse(JSON.stringify(items)));
          },
        },
      });

      const req = {
        params: { id: "order-1" },
        body: {
          status: "Processing",
          paymentStatus: "Paid",
          products: [
            {
              id: "product-2",
              sku: "SKU-NEW",
              name: "Updated Product",
              quantity: 2,
              amount: 300,
            },
          ],
        },
      };
      const res = createResponse();

      await controller.updateStatus(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(orderState.current.status, "Processing");
      assert.equal(orderState.current.paymentStatus, "Paid");
      assert.equal(orderState.current.price.subtotal, 300);
      assert.equal(orderState.current.price.total, 310);
      assert.equal(orderState.current.amount, 310);
      assert.equal(orderState.current.totalQuantity, 2);
      assert.equal(juraRequests.length, 1);
      assert.equal(juraRequests[0].products[0].sku, "SKU-NEW");
      assert.deepEqual(stockCalls.validate[0], [
        {
          productId: "product-2",
          sku: "SKU-NEW",
          name: "Updated Product",
          quantity: 2,
        },
      ]);
      assert.deepEqual(stockCalls.restock[0], [
        {
          productId: "product-1",
          sku: "SKU-OLD",
          name: "Old Product",
          quantity: 1,
        },
      ]);
      assert.deepEqual(stockCalls.deduct[0], [
        {
          productId: "product-2",
          sku: "SKU-NEW",
          name: "Updated Product",
          quantity: 2,
        },
      ]);
    },
  },
];

(async () => {
  for (const check of checks) {
    try {
      await check.run();
      console.log(`PASS ${check.name}`);
    } catch (error) {
      console.error(`FAIL ${check.name}`);
      
      process.exitCode = 1;
      return;
    }
  }
})();
