const nodemailer = require("nodemailer");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ================= REGISTER =================
// ================= REGISTER =================
exports.registerUser = async (req, res) => {
  try {

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields."
      });
    }

    // Strong Password Validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    const safeRole =
      role === "owner"
        ? "owner"
        : "tenant";

    await User.create({
      name,
      email,
      password,
      role: safeRole,
      verificationToken,
      isVerified: false
    });

    const transporter =
      nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

    const verificationLink =
      `http://localhost:5000/api/auth/verify/${verificationToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your RentEase account",
      html: `
        <h2>Welcome to RentEase</h2>
        <p>Please verify your email.</p>

        <a href="${verificationLink}">
          Verify Account
        </a>
      `
    });

    return res.status(201).json({
      message:
        "Registration successful. Check your email."
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: error.message
    });

  }
};
// ================= LOGIN =================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isVerified)
      return res.status(401).json({ message: "Please verify your email first" });

    const isMatch = await user.matchPassword(password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      profilePicture: user.profilePicture,
      role: user.role,
      token: generateToken(user._id, user.role),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required."
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;

    user.resetPasswordExpires =
      Date.now() + 1000 * 60 * 15;

    await user.save();

    const transporter =
      nodemailer.createTransport({

        service: "gmail",

        auth: {

          user: process.env.EMAIL_USER,

          pass: process.env.EMAIL_PASS

        }

      });

    const resetLink =
      `http://localhost:5500/reset-password.html?token=${resetToken}`;

    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: user.email,

      subject: "Reset Your RentEase Password",

      html: `
        <h2>Password Reset</h2>

        <p>Click the button below to reset your password.</p>

        <a
            href="${resetLink}"
            style="
                background:#2563eb;
                color:white;
                padding:12px 20px;
                text-decoration:none;
                border-radius:6px;
            "
        >
            Reset Password
        </a>

        <p>This link expires in 15 minutes.</p>
      `

    });

    res.json({
      message: "Password reset email sent."
    });

  }

  catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });

  }

};


// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {

  try {

    const { token, password } = req.body;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

    if (!passwordRegex.test(password)) {

      return res.status(400).json({

        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."

      });

    }

    const user = await User.findOne({

      resetPasswordToken: token,

      resetPasswordExpires: {
        $gt: Date.now()
      }

    });

    if (!user) {

      return res.status(400).json({

        message:
          "Reset link is invalid or has expired."

      });

    }

    user.password = password;

    user.resetPasswordToken = null;

    user.resetPasswordExpires = null;

    await user.save();

    res.json({

      message:
        "Password reset successful."

    });

  }

  catch (err) {

    console.error(err);

    res.status(500).json({

      message: err.message

    });

  }

};