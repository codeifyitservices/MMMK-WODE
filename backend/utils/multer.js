const multer = require("multer");
const path = require("path");
const fs = require("fs");
const express = require("express");

const app = express();

// Define the uploads directory
const uploadsDir = path.join(__dirname, "../uploads");

// Ensure the uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true }); // Create the directory if it doesn't exist
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Folder to store uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueName =
      file.fieldname + "-" + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName); // Set unique file name
  },
});

// Multer file filter (optional, you can modify according to your requirements)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/avif",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."),
      false
    );
  }
};

// Set up multer middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter, // File type validation
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
