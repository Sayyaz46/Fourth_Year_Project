const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  issue: String,
  status: {
    type: String,
    default: "Pending"
  },
  priority: String
}, { timestamps: true });

module.exports = mongoose.model("Maintenance", maintenanceSchema);
