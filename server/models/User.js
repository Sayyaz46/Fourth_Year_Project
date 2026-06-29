const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["owner", "tenant", "admin"],
      default: "tenant"
    },

    phone: {
      type: String,
      default: ""
    },

    profilePicture: {
      type: String,
      default: ""
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    verificationToken: {
      type: String,
      default: null
    },

    // Forgot Password
    resetPasswordToken: {
      type: String,
      default: null
    },

    resetPasswordExpires: {
      type: Date,
      default: null
    }

  },
  {
    timestamps: true
  }
);

// Hash password before saving
// Hash password before saving
userSchema.pre("save", async function () {

    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);

});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {

  return await bcrypt.compare(
    enteredPassword,
    this.password
  );

};

module.exports = mongoose.model("User", userSchema);