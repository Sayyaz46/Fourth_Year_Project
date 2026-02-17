const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property"
  },
  leaseStart: Date,
  leaseEnd: Date,
  nextPaymentDue: Date
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
