const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err?.message?.startsWith("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({ message: "Internal server error" });
};

module.exports = errorHandler;
