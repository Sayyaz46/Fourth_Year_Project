const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Maintenance = require("../models/Maintenance");

router.get("/dashboard", protect, async (req, res) => {
  const booking = await Booking.findOne({ tenant: req.user._id })
    .populate("property");

  const payments = await Payment.find({ tenant: req.user._id });

  const maintenance = await Maintenance.find({ tenant: req.user._id });

  res.json({
    booking,
    payments,
    maintenance
  });
});

module.exports = router;
