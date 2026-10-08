const User = require("../../Models/User");
var jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendMail } = require("../../services/mailService");
const { ResetToken } = require("../../Models/ResetToken");

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(404).json({
        success: false,
        message: "All fields are required",
      });
    }

    // comparing password and confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match",
      });
    }

    // checking is user already exists
    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // signingup user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
    });

    const createdUser = await user.save();

    const token = jwt.sign(
      {
        id: createdUser._id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
      },
      process.env.SECRET_KEY,
      { expiresIn: "8h" }
    );

    // Set token in cookie
    res.cookie("userToken", token, {
      httpOnly: true,
      secure: false,
      maxAge: 8 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "Signup successfully",
      data: {
        id: createdUser._id,
        email: createdUser.email,
        token,
      }
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(404).json({
        success: false,
        message: "Email and password required",
      });
    }

    // Checking user is registered or not
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Comparing password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // generating token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.SECRET_KEY,
      { expiresIn: "8h" }
    );

    // Set token in cookie
    res.cookie("userToken", token, {
      httpOnly: true,
      secure: false,
      maxAge: 8 * 60 * 60 * 1000,
    });

    // Respond with success message
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        id: user._id,
        email: user.email,
        token,
      },
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(404).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not registered",
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const resetToken = new ResetToken({
      token,
      userId: user._id,
    });
    await resetToken.save();

    // Send email with reset token
    const resetUrl = `${process.env.CLIENT_URL}reset-password/${resetToken.token}`;

    await sendMail(
      email,
      "Password Reset",
      "",
      `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      color: #333;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background-color: #0078d7;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      font-size: 24px;
    }
    .email-body {
      padding: 20px;
    }
    .email-body p {
      margin: 0 0 15px;
      line-height: 1.6;
    }
    .reset-button {
      display: block;
      width: fit-content;
      margin: 20px auto;
      padding: 10px 20px;
      background-color: #0078d7;
      color: #ffffff;
      text-decoration: none;
      font-size: 16px;
      border-radius: 6px;
      text-align: center;
    }
    .reset-button:hover {
      background-color: #005a9e;
    }
    .email-footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      padding: 20px;
      border-top: 1px solid #eeeeee;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header Section -->
    <div class="email-header">
      <h1>Password Reset Request</h1>
    </div>

    <!-- Body Section -->
    <div class="email-body">
      <p>Hi there,</p>
      <p>We received a request to reset your password. If you didn’t make this request, please ignore this email.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" class="reset-button">Reset Password</a>
      <p>If the button above doesn’t work, copy and paste the following link into your browser:</p>
      <p><a href="${resetUrl}" style="color: #0078d7;">${resetUrl}</a></p>
      <p>This link will expire in 24 hours for security purposes.</p>
    </div>

    <!-- Footer Section -->
    <div class="email-footer">
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Thanks, <br> The MMMK Team</p>
    </div>
  </div>
</body>
</html>
`
    );

    res.status(201).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (err) {
    
  }
};

const updatePassword = async (req, res) => {
  try {
    const token = req.params.token;
    const { password } = req.body;
    const resetToken = await ResetToken.findOne({ token });

    if (!resetToken) {
      return res.status(404).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const user = await User.findById(resetToken.userId);

    // updating password
    user.password = req.body.password;
    await user.save();

    // deleting reset token
    await ResetToken.findByIdAndDelete(resetToken._id);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const logout = async (req, res) => {
  try {
    // Clear the authentication cookie
    res.clearCookie("userToken", {
      httpOnly: true,
      secure: false,
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
module.exports = { signup, login, logout, forgotPassword, updatePassword };
