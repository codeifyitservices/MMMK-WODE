const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const Influencer = require("../Models/Influencer");

const getBearerToken = (req) => {
  const authHeader =
    req.headers.authorization || req.headers.Authorization || "";

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
};

const isInfluencer = async (req, res, next) => {
  const token =
    getBearerToken(req) ||
    req.cookies?.influencerToken ||
    req.headers["x-influencer-token"];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No authentication token provided. Access denied.",
    });
  }

  try {
    const secret = process.env.SECRET_KEY || process.env.JWT_SECRET;
    if (!secret) {
      console.error("[InfluencerAuth] SECRET_KEY environment variable is not defined!");
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error.",
      });
    }
    const decoded = jwt.verify(token, secret);

    const influencer = await Influencer.findById(decoded.id);

    if (!influencer) {
      return res.status(401).json({
        success: false,
        message: "Influencer account not found.",
      });
    }

    if (influencer.status === "Suspended") {
      return res.status(403).json({
        success: false,
        message: "Your influencer account has been suspended. Please contact support.",
      });
    }

    if (influencer.status !== "Approved") {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${influencer.status.toLowerCase()}. Access to the influencer portal is only permitted for approved partners.`,
      });
    }

    req.influencer = influencer;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid token. Please log in again.",
    });
  }
};

module.exports = { isInfluencer, getBearerToken };
