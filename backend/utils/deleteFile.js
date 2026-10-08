const fs = require("fs");
const path = require("path");
const { getThumbnailFileName } = require("./productThumbnail");

const getStoredFileName = (fileName) => {
  if (!fileName || typeof fileName !== "string") return null;

  if (/^https?:\/\//i.test(fileName)) {
    try {
      const parsedUrl = new URL(fileName);

      if (!parsedUrl.pathname.includes("/uploads/")) {
        return null;
      }

      return path.basename(parsedUrl.pathname);
    } catch (error) {
      return null;
    }
  }

  return fileName;
};

const deleteFile = (fileName) => {
  const storedFileName = getStoredFileName(fileName);
  if (!storedFileName) return;

  const filePath = path.join(__dirname, "../uploads", storedFileName);
  const thumbnailFileName = storedFileName.startsWith("thumb-")
    ? null
    : getThumbnailFileName(storedFileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      if (err.code !== "ENOENT") {
      }
    }
  });

  if (thumbnailFileName) {
    const thumbnailPath = path.join(__dirname, "../uploads", thumbnailFileName);
    fs.unlink(thumbnailPath, (err) => {
      if (err) {
        if (err.code !== "ENOENT") {
        }
      }
    });
  }
};

module.exports = deleteFile;
