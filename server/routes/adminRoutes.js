const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const User = require("../models/User");

// GET ALL USERS (Admin only)
router.get("/users", protect, authorizeRoles("admin"), async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// DELETE USER
router.delete("/users/:id", protect, authorizeRoles("admin"), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

module.exports = router;
