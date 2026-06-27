const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending"
  },
  moveInDate: Date,
  leaseDuration: {
    type: Number,
    default: 12
  },
  leaseStart: Date,
  leaseEnd: Date,
  nextPaymentDue: Date,
  fullName: String,
  email: String,
  phone: String,
  occupation: String,
  monthlyIncome: Number,
  emergencyContact: String,
  emergencyPhone: String,
  documents: {
    type: [String],
    default: []
  },
  decisionNote: String,
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
