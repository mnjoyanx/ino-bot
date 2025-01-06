const path = require("path");

console.log(path.resolve(__dirname, "../.env"));
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const config = require("../config/api.config");
const connectDB = require("../config/db");

console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("API_PORT:", process.env.API_PORT);

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.ALLOWED_ORIGINS,
    credentials: true,
  })
);
app.use(express.json());

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  try {
    const verified = jwt.verify(token, config.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};

// Import route handlers
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const feedbackRoutes = require("./routes/feedback");
const absenceRoutes = require("./routes/absences");
const performanceRoutes = require("./routes/performance");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/feedback", authenticateToken, feedbackRoutes);
app.use("/api/absences", authenticateToken, absenceRoutes);
app.use("/api/performance", authenticateToken, performanceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const PORT = config.API_PORT;
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});

module.exports = app;
