require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const passport = require("passport");
const MongoStore = require("connect-mongo");
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
    credentials: true, // ✅ CRITICAL: Allows cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session configuration - FIXED
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: isProduction, // ✅ FIXED: true in production, false in development
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ✅ Debug middleware - Log all sessions
app.use((req, res, next) => {
  console.log("🔍 Session ID:", req.sessionID);
  console.log("🔍 Session User:", req.session?.user);
  next();
});

// ✅ Routes setup
app.use(`${BASE_URL}auth`, authRoute);
app.use(`${BASE_URL}user`, resultRoute);
app.use(`${BASE_URL}admin`, adminRoute);

// ✅ Middleware
const { requireAuth } = require("./middleware/authMiddleware");

// ✅ Core functionality routes
const uploadRoute = require("./routes/Upload");
const analysisRoute = require("./routes/analysis");
const feedbackRoute = require("./routes/feedback");
const statsRoute = require("./routes/stats");
const categoriesRoute = require("./routes/categories");

app.use("/api", statsRoute);
app.use("/", categoriesRoute);
app.use("/api", requireAuth, uploadRoute);
app.use("/api", requireAuth, analysisRoute);
app.use("/api", requireAuth, feedbackRoute);

// ✅ Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ✅ MongoDB connection
const dbURI = process.env.MONGO_URI;

mongoose
  .connect(dbURI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`✅ Client URL: ${process.env.CLIENT_URL}`);
      console.log(`✅ Cookie Secure: ${isProduction}`);
      console.log(`✅ Cookie SameSite: ${isProduction ? "none" : "lax"}`);
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
  });