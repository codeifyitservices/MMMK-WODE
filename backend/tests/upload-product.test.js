const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const multer = require("multer");

const projectRoot = path.resolve(__dirname, "..");

const createResponse = () => {
  return {
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
  };
};

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
      "../../../services/translate": { translateText: async () => "" },
      "./product.helpers": { getTranslatedFields: async () => ({}) },
      "../../../utils/staticData": { LANGUAGECODES: ["en"] },
    }
  );

  return { controller, session, Product, SKU };
};

test("uploadImages returns uploaded file names", async () => {
  const { uploadImages } = require(path.join(
    projectRoot,
    "Controller",
    "admin-controllers",
    "upload",
    "upload.controller.js"
  ));

  const req = {
    files: [{ filename: "image-1.png" }, { filename: "image-2.webp" }],
  };
  const res = createResponse();

  await uploadImages(req, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body.data.files, ["image-1.png", "image-2.webp"]);
  assert.equal(res.body.data.file, "image-1.png");
});

test("uploadImages rejects missing files with 400", async () => {
  const { uploadImages } = require(path.join(
    projectRoot,
    "Controller",
    "admin-controllers",
    "upload",
    "upload.controller.js"
  ));

  const req = { files: [] };
  const res = createResponse();

  await uploadImages(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "At least one file is required");
});

test("create product succeeds for valid multipart payload", async () => {
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
      showOnHomepage: true,
    },
    files: {
      image: [{ filename: "primary.png" }],
      images: [{ filename: "gallery-1.png" }, { filename: "gallery-2.png" }],
    },
  };
  const res = createResponse();

  await controller.create(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.image, "primary.png");
  assert.equal(res.body.data.thumbnail, "thumb-primary.png.webp");
  assert.deepEqual(res.body.data.images, ["gallery-1.png", "gallery-2.png"]);
  assert.equal(res.body.data.quantity, 5);
  assert.equal(insertedSkus.length, 2);
  assert.equal(session.committed, true);
});

test("create product returns 400 for invalid skus JSON instead of 500", async () => {
  const deletedFiles = [];
  const { controller } = loadProductController({
    deleteFileImpl: (file) => deletedFiles.push(file),
  });

  const req = {
    body: {
      productName: JSON.stringify({ en: "Argan Oil" }),
      skus: "{bad json",
    },
    files: {
      image: [{ filename: "primary.png" }],
      images: [{ filename: "gallery-1.png" }],
    },
  };
  const res = createResponse();

  await controller.create(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Invalid skus payload/);
  assert.deepEqual(deletedFiles.sort(), ["gallery-1.png", "primary.png"]);
});

test("update product succeeds for valid edit payload", async () => {
  const deletedFiles = [];
  const savedSnapshots = [];
  const existingProduct = {
    _id: "product-1",
    image: "old-primary.png",
    thumbnail: "thumb-old-primary.webp",
    images: ["old-gallery.png"],
    save: async function save() {
      savedSnapshots.push({
        image: this.image,
        images: [...this.images],
        quantity: this.quantity,
        filters: [...this.filters],
      });
    },
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
    deleteFileImpl: (file) => deletedFiles.push(file),
  });

  const req = {
    params: { id: "product-1" },
    body: {
      category: "cat-1",
      subCategory: "sub-1",
      status: "Active",
      brand: "MMMK",
      homePageBottomSection: false,
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
      showOnHomepage: true,
      websitePrice: "95",
    },
    files: {
      image: [{ filename: "new-primary.png" }],
      images: [{ filename: "new-gallery.png" }],
    },
  };
  const res = createResponse();

  await controller.updateProduct(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(existingProduct.image, "new-primary.png");
  assert.equal(existingProduct.thumbnail, "thumb-new-primary.png.webp");
  assert.deepEqual(existingProduct.images, ["new-gallery.png"]);
  assert.equal(existingProduct.quantity, 4);
  assert.equal(savedSnapshots.length, 1);
  assert.equal(session.committed, true);
  assert.deepEqual(
    deletedFiles.sort(),
    ["old-gallery.png", "old-primary.png", "thumb-old-primary.webp"].sort()
  );
});

test("update product returns 400 for invalid deletedImages JSON instead of 500", async () => {
  const { controller } = loadProductController();
  const req = {
    params: { id: "product-1" },
    body: {
      skus: JSON.stringify([{ sku: "SKU-1", quantity: 1, filters: {} }]),
      deletedImages: "{bad json",
    },
  };
  const res = createResponse();

  await controller.updateProduct(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /Invalid deletedImages payload/);
});

test("error handler maps multer and file validation errors to 400", async () => {
  const errorHandler = require(path.join(projectRoot, "Middleware", "errorHandler.js"));
  const multerRes = createResponse();
  const fileTypeRes = createResponse();

  errorHandler(new multer.MulterError("LIMIT_FILE_SIZE"), {}, multerRes, () => {});
  errorHandler(new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."), {}, fileTypeRes, () => {});

  assert.equal(multerRes.statusCode, 400);
  assert.equal(multerRes.body.success, false);
  assert.equal(fileTypeRes.statusCode, 400);
  assert.equal(fileTypeRes.body.success, false);
});
