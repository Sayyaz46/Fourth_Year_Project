const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: String,
  address: String,
  rent: Number,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  approved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);
