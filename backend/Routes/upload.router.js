const express = require("express");
const upload = require("../utils/multer");
const { uploadImages } = require("../Controller/admin-controllers/upload/upload.controller");

const router = express.Router();

router.post("/images", upload.array("files", 10), uploadImages);

module.exports = router;
