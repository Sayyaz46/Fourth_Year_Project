const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  amount: Number,
  method: String,
  status: {
    type: String,
    default: "Paid"
  }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
