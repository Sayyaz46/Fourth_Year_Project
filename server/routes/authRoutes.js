const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { registerUser, loginUser } = require("../controllers/authController");

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

module.exports = router;
