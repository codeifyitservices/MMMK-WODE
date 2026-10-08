const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./Config/db");
const cors = require("cors");
const routes = require("./routes");
const cookieParser = require("cookie-parser");
const errorHandler = require("./Middleware/errorHandler");
const { LANGUAGECODES } = require("./utils/staticData");

connectDB();

const app = express();
app.enable("trust proxy");

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "https://mmmk-frontend.vercel.app",
  "https://mmmk-frontend-git-local-devyansh-grovers-projects.vercel.app",
  "https://mmmk-wood-org.onrender.com",
  "https://mmmk-wode.vercel.app/",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://mmk.projects.codenap.in",
]
  .flatMap((value) => (value ? value.split(",") : []))
  .map((value) => value.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  const isProduction = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `img-src 'self' data: blob: https: ${!isProduction ? "http: localhost:* 127.0.0.1:*" : ""}`,
    `media-src 'self' blob: https: ${!isProduction ? "http: localhost:* 127.0.0.1:*" : ""}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    `connect-src 'self' https: ${!isProduction ? "http: localhost:* 127.0.0.1:*" : ""}`,
    "form-action 'self'",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Content-Security-Policy", csp);
  next();
});

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1y",
    immutable: true,
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Checkout-Verification",
      "X-Language",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

app.use(cookieParser());
app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/payment/webhook") {
    next(); // Skip JSON parsing for the webhook route
  } else {
    express.json()(req, res, next);
  }
});
app.use((req, res, next) => {
  const requestedLanguage =
    req.headers["x-language"] ||
    req.headers["language"] ||
    req.query.lang ||
    req.body?.lang ||
    req.body?.language ||
    req.headers["accept-language"]?.split(",")[0]?.split("-")[0];

  req.lang = LANGUAGECODES.includes(requestedLanguage)
    ? requestedLanguage
    : "en";
  next();
});
app.use(routes);

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running",
  });
});

// Default error handler
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const {
    startAbandonedCartScheduler,
  } = require("./services/abandonedCartService");
  startAbandonedCartScheduler();
});
