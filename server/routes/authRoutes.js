const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Email Verification
router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
    });

    if (!user) {
      return res.status(400).send("Invalid or expired token");
    }

    user.isVerified = true;
    user.verificationToken = undefined;

    await user.save();

    res.send(`
      <h2>Email Verified Successfully!</h2>
      <p>You can now login.</p>
      <a href="http://localhost:5500/login.html">Go to Login</a>
    `);

  } catch (error) {
    res.status(500).send("Verification failed");
  }
});

// TEMPORARY ADMIN CREATOR
router.get("/create-admin", async (req, res) => {
  try {
    const existingAdmin = await User.findOne({
      email: "sayyazmehrab5699@gmail.com",
    });

    if (existingAdmin) {
      return res.json({
        message: "Admin already exists",
      });
    }

    const admin = await User.create({
      name: "Mehrab Admin",
      email: "sayyazmehrab5699@gmail.com",
      password: "Pinak420",
      role: "admin",
      isVerified: true,
      verificationToken: null,
    });

    res.json({
      message: "Admin created successfully",
      admin,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;