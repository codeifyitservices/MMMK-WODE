const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const Admin = require("./../Models/Admin");

const getBearerToken = (req) => {
  const authHeader =
    req.headers.authorization || req.headers.Authorization || "";

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
};

const isAdmin = async (req, res, next) => {
  const token = getBearerToken(req) || req.cookies.adminAuthToken;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = { isAdmin };
