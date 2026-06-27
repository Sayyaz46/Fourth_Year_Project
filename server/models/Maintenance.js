const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property"
  },
  issue: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Resolved", "Rejected"],
    default: "Pending"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "Low", "Medium", "High"],
    default: "medium"
  },
  ownerNote: String,
  photos: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Maintenance", maintenanceSchema);
