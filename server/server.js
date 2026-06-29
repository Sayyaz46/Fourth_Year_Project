const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000"
  ],
  credentials: true
}));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// ==========================
// TEST ROUTE
// ==========================
app.get("/hello", (req, res) => {
  res.send("HELLO SERVER");
});

// ==========================
// API ROUTES
// ==========================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

const tenantRoutes = require("./routes/tenantRoutes");

console.log("TENANT ROUTES TYPE:", typeof tenantRoutes);

app.use("/api/tenant", tenantRoutes);

console.log("Tenant Routes Loaded");

app.use("/api/owner", require("./routes/ownerRoutes"));

// ==========================
// ERROR HANDLER
// ==========================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Server error"
  });
});

// ==========================
// START SERVER
// ==========================
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server due to DB connection error");
    console.error(err);
  });

module.exports = app;