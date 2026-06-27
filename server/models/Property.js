const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  rent: {
    type: Number,
    required: true,
    min: 0
  },
  bedrooms: {
    type: Number,
    default: 1,
    min: 0
  },
  bathrooms: {
    type: Number,
    default: 1,
    min: 0
  },
  sqft: {
    type: Number,
    default: 0,
    min: 0
  },
  propertyType: {
    type: String,
    default: "Apartment",
    trim: true
  },
  tenantType: {
    type: String,
    default: "Any",
    trim: true
  },
  amenities: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ["available", "occupied", "maintenance", "inactive"],
    default: "available"
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  approved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);
