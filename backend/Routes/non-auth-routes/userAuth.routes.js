const router = require("express").Router();

// controller
const {
  signup,
  login,
  forgotPassword,
  updatePassword,
  logout,
} = require("../../Controller/user-controllers/auth.controller");

// routes
router.post("/login", login);
router.get("/logout", logout);
router.post("/signup", signup);
router.post("/forgot-password", forgotPassword);
router.post("/update-password/:token", updatePassword);

module.exports = router;
