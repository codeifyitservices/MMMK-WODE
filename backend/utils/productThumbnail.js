const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const uploadsDir = path.join(__dirname, "../uploads");
const THUMBNAIL_WIDTH = 500;
const THUMBNAIL_QUALITY = 70;

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

  const sourcePath = path.join(uploadsDir, storedFileName);
  const thumbnailPath = path.join(uploadsDir, thumbnailFileName);

  if (!fs.existsSync(sourcePath)) {
    return null;
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

    return thumbnailFileName;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateProductThumbnail,
  getThumbnailFileName,
  getStoredUploadFileName,
};
