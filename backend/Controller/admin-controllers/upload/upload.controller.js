const { generateProductThumbnail } = require("../../../utils/productThumbnail");

const DEFAULT_PUBLIC_UPLOAD_BASE_URL = "https://node.projects.codenap.in/mmk";

const buildUploadedFileUrl = (req, fileName) => {
  return fileName || null;
};

const uploadImages = async (req, res) => {
  try {
    const fileNames = req.files?.map((file) => file.filename) || [];
    const thumbnailNames = await Promise.all(
      fileNames.map((fileName) => generateProductThumbnail(fileName))
    );
    const files = fileNames
      .map((fileName) => buildUploadedFileUrl(req, fileName))
      .filter(Boolean);

    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "At least one file is required",
      });
    }

    res.status(201).json({
      success: true,
      message: "Files uploaded successfully",
      data: {
        files,
        thumbnails: thumbnailNames.filter(Boolean),
        file: files[0],
        rawFiles: fileNames,
        rawFile: fileNames[0],
      },
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload files",
    });
  }
};

module.exports = {
  uploadImages,
};
