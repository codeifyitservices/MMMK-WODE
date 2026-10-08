const router = require("express").Router();

// controller
const {
  login,
  createAdmin,
  logout,
  forgotPassword,
  updatePassword,
} = require("../../Controller/admin-controllers/auth/auth.controller");

const { adminAuthLimiter } = require("../../Middleware/AdminAuthLimiter");

// routes
router.post("/login", adminAuthLimiter, login);
// router.post("/create", createAdmin); // Removed for security - only owners should have access
router.get("/logout", logout);
router.post("/forgot-password", adminAuthLimiter, forgotPassword);
router.post("/reset-password/:token", updatePassword);

module.exports = router;
