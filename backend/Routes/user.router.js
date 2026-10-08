const express = require("express");
const router = express.Router();

const {
  addUser,
  updateUser,
  getSingleUser,
  getAllUsers,
  deleteUser,
} = require("../Controller/admin-controllers/user/user.controller");

// routes
router.post("/create", addUser);
router.post("/update/:id", updateUser);
router.get("/get/:id", getSingleUser);
router.get("/get-all", getAllUsers);
router.get("/delete/:id", deleteUser);

module.exports = router;
