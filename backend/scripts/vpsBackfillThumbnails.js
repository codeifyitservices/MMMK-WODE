const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const BSON = require("bson");

const BSON_FILE = "/root/database/test/products.bson";
const UPLOADS_DIR = "/root/backend/uploads";

const THUMBNAIL_WIDTH = 500;
const THUMBNAIL_QUALITY = 70;

// Helper functions for image extraction
const getStoredUploadFileName = (fileName) => {
  if (!fileName || typeof fileName !== "string") return null;

  if (/^https?:\/\//i.test(fileName)) {
    try {
      const parsedUrl = new URL(fileName);
      if (!parsedUrl.pathname.includes("/uploads/")) return null;
      return path.basename(parsedUrl.pathname);
    } catch (error) {
      return null;
    }
  }

  return path.basename(fileName);
};

const getThumbnailFileName = (fileName) => {
  const storedFileName = getStoredUploadFileName(fileName);
  if (!storedFileName) return null;

  const parsedPath = path.parse(storedFileName);
  return `thumb-${parsedPath.name}.webp`;
};

const generateProductThumbnail = async (fileName) => {
  const storedFileName = getStoredUploadFileName(fileName);
  const thumbnailFileName = getThumbnailFileName(fileName);
  if (!storedFileName || !thumbnailFileName) return null;

  const sourcePath = path.join(UPLOADS_DIR, storedFileName);
  const thumbnailPath = path.join(UPLOADS_DIR, thumbnailFileName);

  if (!fs.existsSync(sourcePath)) {
    return null;
  }

  // Skip if thumbnail already exists
  if (fs.existsSync(thumbnailPath)) {
    return "SKIPPED";
  }

  try {
    await sharp(sourcePath)
      .rotate()
      .resize({
        width: THUMBNAIL_WIDTH,
        withoutEnlargement: true,
      })
      .webp({ quality: THUMBNAIL_QUALITY })
      .toFile(thumbnailPath);

    console.log(`Generated thumbnail: ${thumbnailFileName}`);
    return "GENERATED";
  } catch (error) {
    console.error(`Error processing image ${storedFileName}:`, error.message);
    return "FAILED";
  }
};

const run = async () => {
  if (!fs.existsSync(BSON_FILE)) {
    console.error(`Error: BSON file not found at ${BSON_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error(`Error: Uploads directory does not exist at ${UPLOADS_DIR}`);
    process.exit(1);
  }

  console.log(`Reading products from database file: ${BSON_FILE}`);
  console.log(`Using uploads directory: ${UPLOADS_DIR}`);

  const stats = {
    productsScanned: 0,
    imagesProcessed: 0,
    generated: 0,
    skipped: 0,
    failed: 0,
    sourceMissing: 0,
  };

  try {
    const buffer = fs.readFileSync(BSON_FILE);
    let offset = 0;
    
    // Set to avoid processing duplicate image files
    const processedImages = new Set();

    while (offset < buffer.length) {
      const size = buffer.readInt32LE(offset);
      if (size <= 0 || offset + size > buffer.length) break;

      const docBuffer = buffer.subarray(offset, offset + size);
      const doc = BSON.deserialize(docBuffer);
      stats.productsScanned += 1;

      // Extract all unique image references
      const imageNames = [
        doc.image,
        ...(Array.isArray(doc.images) ? doc.images : []),
      ].filter(Boolean);

      for (const imageName of imageNames) {
        const storedName = getStoredUploadFileName(imageName);
        if (!storedName || processedImages.has(storedName)) {
          continue;
        }
        processedImages.add(storedName);
        stats.imagesProcessed += 1;

        const result = await generateProductThumbnail(imageName);
        if (result === "GENERATED") {
          stats.generated += 1;
        } else if (result === "SKIPPED") {
          stats.skipped += 1;
        } else if (result === "FAILED") {
          stats.failed += 1;
        } else {
          stats.sourceMissing += 1;
        }
      }

      offset += size;
    }

    console.log("\n=========================================");
    console.log("BSON-based Product Thumbnail Backfill Complete:");
    console.log(stats);
    console.log("=========================================");

    process.exit(0);
  } catch (error) {
    console.error("Backfill execution failed:", error);
    process.exit(1);
  }
};

run();
