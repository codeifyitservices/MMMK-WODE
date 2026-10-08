const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const multer = require("multer");

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

const loadProductController = ({
  productOverrides = {},
  skuOverrides = {},
  sessionOverrides = {},
  deleteFileImpl = () => {},
  generateThumbnailImpl = async () => null,
} = {}) => {
  const session = {
    started: false,
    committed: false,
    aborted: false,
    ended: false,
    startTransaction() {
      this.started = true;
      this.committed = false;
      this.aborted = false;
    },
    async commitTransaction() {
      this.committed = true;
    },
    async abortTransaction() {
      this.aborted = true;
    },
    inTransaction() {
      return this.started && !this.committed && !this.aborted;
    },
    endSession() {
      this.ended = true;
    },
    ...sessionOverrides,
  };

  const Product = {
    find() {
      return {
        sort() {
          return this;
        },
        select() {
          return this;
        },
        lean: async () => [],
      };
    },
    findOne() {
      return {
        sort() {
          return this;
        },
        select() {
          return this;
        },
        lean: async () => null,
      };
    },
    async create(items) {
      return items.map((item, index) => ({ _id: `product-${index + 1}`, ...item }));
    },
    findById() {
      return {
        session: async () => null,
      };
    },
    bulkWrite: async () => undefined,
    ...productOverrides,
  };

  const SKU = {
    insertMany: async () => undefined,
    deleteMany: async () => undefined,
    ...skuOverrides,
  };

  const mongooseMock = {
    default: {
      startSession: async () => session,
      Types: {
        ObjectId: class ObjectId {
          constructor(value) {
            this.value = value;
          }
        },
      },
    },
  };

  const controller = requireWithMocks(
    path.join(projectRoot, "Controller", "admin-controllers", "product", "product.controller.js"),
    {
      mongoose: mongooseMock,
      "../../../Models/Product": Product,
      "../../../Models/sku": SKU,
      "../../../utils/deleteFile": deleteFileImpl,
      "../../../utils/productThumbnail": {
        generateProductThumbnail: generateThumbnailImpl,
      },
      "../../../utils/dbUtils": {
        safeStartSession: async () => {
          session.startTransaction();
          return session;
        },
        safeCommitTransaction: async (activeSession) => {
          if (activeSession?.inTransaction()) {
            await activeSession.commitTransaction();
          }
        },
        safeAbortTransaction: async (activeSession) => {
          if (activeSession?.inTransaction()) {
            await activeSession.abortTransaction();
          }
        },
        safeEndSession: (activeSession) => activeSession?.endSession(),
      },
      "../../../services/jura.service": {
        syncProductsToJura: async () => undefined,
      },
      "../../../utils/logger": {
        info: () => undefined,
        error: () => undefined,
      },
      "../../../services/translate": { translateText: async () => "" },
      "./product.helpers": { getTranslatedFields: async () => ({}) },
      "../../../utils/staticData": { LANGUAGECODES: ["en"] },
    }
  );

  return { controller, session };
};

const checks = [
  {
    name: "upload success",
    async run() {
      const { uploadImages } = require(path.join(
        projectRoot,
        "Controller",
        "admin-controllers",
        "upload",
        "upload.controller.js"
      ));
      const res = createResponse();
      await uploadImages(
        { files: [{ filename: "image-1.png" }, { filename: "image-2.webp" }] },
        res
      );
      assert.equal(res.statusCode, 201);
      assert.deepEqual(res.body.data.files, ["image-1.png", "image-2.webp"]);
    },
  },
  {
    name: "upload empty payload",
    async run() {
      const { uploadImages } = require(path.join(
        projectRoot,
        "Controller",
        "admin-controllers",
        "upload",
        "upload.controller.js"
      ));
      const res = createResponse();
      await uploadImages({ files: [] }, res);
      assert.equal(res.statusCode, 400);
    },
  },
  {
    name: "product create success",
    async run() {
      const insertedSkus = [];
      const { controller, session } = loadProductController({
        generateThumbnailImpl: async (image) => `thumb-${image}.webp`,
        productOverrides: {
          findOne() {
            return {
              sort() {
                return this;
              },
              select() {
                return this;
              },
              lean: async () => ({ order: 2 }),
            };
          },
        },
        skuOverrides: {
          async insertMany(items) {
            insertedSkus.push(...items);
          },
        },
      });

      const req = {
        body: {
          category: "cat-1",
          subCategory: "sub-1",
          status: "Active",
          productName: JSON.stringify({ en: "Argan Oil" }),
          productDescription: JSON.stringify({ en: "Hydrating oil" }),
          uses: JSON.stringify({ en: "Daily" }),
          benefits: JSON.stringify({ en: "Shine" }),
          price: "100",
          discount: "10",
          gender: "Women",
          weight: "1",
          brand: "MMMK",
          websitePrice: "90",
          filters: JSON.stringify(["Size", "Color"]),
          skus: JSON.stringify([
            { sku: "SKU-1", quantity: 2, filters: { Size: "M", Color: "Red" } },
            { sku: "SKU-2", quantity: 3, filters: { Size: "L", Color: "Blue" } },
          ]),
        },
        files: {
          image: [{ filename: "primary.png" }],
          images: [{ filename: "gallery-1.png" }, { filename: "gallery-2.png" }],
        },
      };
      const res = createResponse();

      await controller.create(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.data.quantity, 5);
      assert.equal(res.body.data.thumbnail, "thumb-primary.png.webp");
      assert.equal(insertedSkus.length, 2);
      assert.equal(session.committed, true);
    },
  },
  {
    name: "product create invalid skus payload",
    async run() {
      const { controller } = loadProductController();
      const res = createResponse();
      await controller.create(
        {
          body: {
            productName: JSON.stringify({ en: "Argan Oil" }),
            skus: "{bad json",
          },
          files: {
            image: [{ filename: "primary.png" }],
          },
        },
        res
      );
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /Invalid skus payload/);
    },
  },
  {
    name: "product update success",
    async run() {
      const existingProduct = {
        _id: "product-1",
        image: "old-primary.png",
        thumbnail: "thumb-old-primary.webp",
        images: ["old-gallery.png"],
        save: async function save() {},
      };

      const { controller, session } = loadProductController({
        generateThumbnailImpl: async (image) => `thumb-${image}.webp`,
        productOverrides: {
          findById() {
            return {
              session: async () => existingProduct,
            };
          },
        },
      });

      const res = createResponse();
      await controller.updateProduct(
        {
          params: { id: "product-1" },
          body: {
            category: "cat-1",
            subCategory: "sub-1",
            status: "Active",
            brand: "MMMK",
            price: "100",
            discount: "5",
            gender: "Women",
            weight: "1",
            deletedImages: JSON.stringify(["old-gallery.png"]),
            filters: JSON.stringify(["Size"]),
            skus: JSON.stringify([
              { sku: "SKU-1", quantity: 4, filters: { Size: "M" } },
            ]),
            productName: JSON.stringify({ en: "Updated Oil" }),
            productDescription: JSON.stringify({ en: "Updated description" }),
            uses: JSON.stringify({ en: "Nightly" }),
            benefits: JSON.stringify({ en: "Softness" }),
            websitePrice: "95",
          },
          files: {
            image: [{ filename: "new-primary.png" }],
            images: [{ filename: "new-gallery.png" }],
          },
        },
        res
      );

      assert.equal(res.statusCode, 200);
      assert.equal(existingProduct.image, "new-primary.png");
      assert.equal(existingProduct.thumbnail, "thumb-new-primary.png.webp");
      assert.deepEqual(existingProduct.images, ["new-gallery.png"]);
      assert.equal(session.committed, true);
    },
  },
  {
    name: "product update finalImages replaces gallery and dedupes names",
    async run() {
      const deletedFiles = [];
      const existingProduct = {
        _id: "product-2",
        image: "primary.png",
        images: ["a.png", "b.png", "b.png", "c.png"],
        save: async function save() {},
      };

      const { controller } = loadProductController({
        productOverrides: {
          findById() {
            return {
              session: async () => existingProduct,
            };
          },
        },
        deleteFileImpl: (file) => deletedFiles.push(file),
      });

      const res = createResponse();
      await controller.updateProduct(
        {
          params: { id: "product-2" },
          body: {
            category: "cat-1",
            subCategory: "sub-1",
            status: "Active",
            brand: "MMMK",
            price: "100",
            discount: "5",
            gender: "Women",
            weight: "1",
            deletedImages: JSON.stringify(["b.png"]),
            finalImages: JSON.stringify(["a.png", "c.png", "c.png"]),
            filters: JSON.stringify(["Size"]),
            skus: JSON.stringify([
              { sku: "SKU-1", quantity: 4, filters: { Size: "M" } },
            ]),
            productName: JSON.stringify({ en: "Updated Oil" }),
            productDescription: JSON.stringify({ en: "Updated description" }),
            uses: JSON.stringify({ en: "Nightly" }),
            benefits: JSON.stringify({ en: "Softness" }),
            websitePrice: "95",
          },
        },
        res
      );

      assert.equal(res.statusCode, 200);
      assert.deepEqual(existingProduct.images, ["a.png", "c.png"]);
      assert.deepEqual(deletedFiles.sort(), ["b.png"].sort());
    },
  },
  {
    name: "product update invalid deletedImages payload",
    async run() {
      const { controller } = loadProductController();
      const res = createResponse();
      await controller.updateProduct(
        {
          params: { id: "product-1" },
          body: {
            skus: JSON.stringify([{ sku: "SKU-1", quantity: 1, filters: {} }]),
            deletedImages: "{bad json",
          },
        },
        res
      );
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /Invalid deletedImages payload/);
    },
  },
  {
    name: "multer and file type errors return 400",
    async run() {
      const errorHandler = require(path.join(projectRoot, "Middleware", "errorHandler.js"));
      const multerRes = createResponse();
      const fileTypeRes = createResponse();

      errorHandler(new multer.MulterError("LIMIT_FILE_SIZE"), {}, multerRes, () => {});
      errorHandler(
        new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."),
        {},
        fileTypeRes,
        () => {}
      );

      assert.equal(multerRes.statusCode, 400);
      assert.equal(fileTypeRes.statusCode, 400);
    },
  },
];

(async () => {
  let passed = 0;
  const originalConsoleError = console.error;

  console.error = () => {};

  try {
    for (const check of checks) {
      try {
        await check.run();
        passed += 1;
        console.log(`PASS ${check.name}`);
      } catch (error) {
        originalConsoleError(`FAIL ${check.name}`);
        originalConsoleError(error);
        process.exit(1);
      }
    }

    console.log(`Completed ${passed}/${checks.length} checks`);
  } finally {
    console.error = originalConsoleError;
  }
})();
