const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property"
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    default: "Manual"
  },
  month: String,
  transactionId: String,
  screenshot: {
    type: String,
    default: ""
  },
  receiptNumber: {
    type: String,
    default: ""
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: "Paid"
  }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
