require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("./config/passport");

const BASE_URL = "/api/v1/";

//Import Routes
const authRoute = require("./routes/auth/auth-route");
const resultRoute = require("./routes/user/resume-optimize-result-route");
const adminRoute = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Trust proxy (REQUIRED for Render/Heroku)
app.set("trust proxy", 1);

// ✅ Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable if you're serving static files
    crossOriginEmbedderPolicy: false,
  })
);

// ✅ Create uploads folder if missing
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Determine environment
const isProduction = process.env.NODE_ENV === "production";

// ✅ CORS - Use your actual frontend URL
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173", // for local development
].filter(Boolean);

// ⚠️ CORS MUST come BEFORE session middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Rate Limiting for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login/signup attempts per window
  message: {
    success: false,
    message:
      "Too many authentication attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
});

// ✅ Rate Limiting for API Routes (more lenient)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      touchAfter: 24 * 3600, // Lazy session update (in seconds)
    }),
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ✅ Debug middleware - Log all sessions (disable in production)
if (!isProduction) {
  app.use((req, res, next) => {
    console.log("🔍 Session ID:", req.sessionID);
    console.log("🔍 Session User:", req.session?.user);
    next();
  });
}

// ✅ Apply rate limiting to auth routes
app.use(`${BASE_URL}auth/signin`, authLimiter);
app.use(`${BASE_URL}auth/signup`, authLimiter);
app.use(`${BASE_URL}auth`, authRoute);

// ✅ Apply general rate limiting to all API routes
app.use("/api", apiLimiter);

// ✅ Admin and user routes
app.use(`${BASE_URL}user`, resultRoute);
app.use(`${BASE_URL}admin`, adminRoute);

// ✅ Middleware
const { requireAuth } = require("./middleware/authMiddleware");

// ✅ Core functionality routes
const uploadRoute = require("./routes/Upload");
const analysisRoute = require("./routes/analysis");
const feedbackRoute = require("./routes/feedback");
const historyRoute = require("./routes/history");
const resultRoute2 = require("./routes/result");
const userProfileRoute = require("./routes/userProfile");

app.use("/api", requireAuth, uploadRoute);
app.use("/api", requireAuth, analysisRoute);
app.use("/api", requireAuth, feedbackRoute);
app.use("/api", requireAuth, historyRoute);
app.use("/api", requireAuth, resultRoute2);
app.use("/api", requireAuth, userProfileRoute);

// ✅ Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err);

  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS policy: Origin not allowed",
    });
  }

  // Multer file upload errors
  if (
    err.message &&
    err.message.includes("Only .pdf and .docx files are allowed")
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? "Internal server error" : err.message,
    ...(!isProduction && err.stack && { stack: err.stack }),
  });
});

// ✅ MongoDB connection
const dbURI = process.env.MONGO_URI;

mongoose
  .connect(dbURI, {
    serverSelectionTimeoutMS: 5000,
    // Additional options for better connection handling
    maxPoolSize: 10,
    minPoolSize: 5,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log("═══════════════════════════════════");
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✅ Client URL: ${process.env.CLIENT_URL}`);
      console.log(`✅ Cookie Secure: ${isProduction}`);
      console.log(`✅ Cookie SameSite: ${isProduction ? "none" : "lax"}`);
      console.log(`✅ Rate Limiting: Enabled`);
      console.log(`✅ Security Headers: Enabled`);
      console.log("═══════════════════════════════════");
    });
  })
  .catch((err) => {
    console.error("❌ DB connection error details:", {
      name: err.name,
      code: err.code,
      message: err.message,
      cause: err.cause,
    });
    console.log(
      "Please check your internet connection and MongoDB Atlas status"
    );
    process.exit(1); // Exit if DB connection fails
  });

// ✅ Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  mongoose.connection.close(false, () => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  mongoose.connection.close(false, () => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});
