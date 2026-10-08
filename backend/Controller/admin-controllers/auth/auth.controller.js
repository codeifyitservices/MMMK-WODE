const Admin = require("../../../Models/Admin");
var jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendMail } = require("../../../services/mailService");
const { ResetToken } = require("../../../Models/ResetToken");

const getAdminCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 8 * 60 * 60 * 1000,
  };
};

const createAdmin = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const admin = new Admin({
      username,
      password,
      email,
    });
    await admin.save();
    res.status(201).json({
      success: true,
      message: "Admin created successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create admin",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const authorizedEmail = process.env.ADMIN_RESET_EMAIL;

    if (!authorizedEmail) {
      return res.status(500).json({
        success: false,
        message: "Admin reset email is not configured in the system",
      });
    }

    // Find the admin with username 'admin'
    const admin = await Admin.findOne({ username: "admin" });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const resetToken = new ResetToken({
      token,
      userId: admin._id,
      onModel: "Admin",
    });
    await resetToken.save();

    // Send email with reset token
    const resetUrl = `${process.env.FRONTEND_URL}admin/reset-password/${resetToken.token}`;

    await sendMail(
      authorizedEmail,
      "Admin Password Reset",
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
      background-color: #000000;
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
      background-color: #000000;
      color: #ffffff;
      text-decoration: none;
      font-size: 16px;
      border-radius: 6px;
      text-align: center;
    }
    .reset-button:hover {
      background-color: #333333;
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
    <div class="email-header">
      <h1>Admin Password Reset</h1>
    </div>
    <div class="email-body">
      <p>Hi Admin,</p>
      <p>We received a request to reset your admin password. If you didn’t make this request, please ignore this email.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" class="reset-button">Reset Password</a>
      <p>If the button above doesn’t work, copy and paste the following link into your browser:</p>
      <p><a href="${resetUrl}" style="color: #000000;">${resetUrl}</a></p>
      <p>This link will expire in 15 minutes for security purposes.</p>
    </div>
    <div class="email-footer">
      <p>If you have any questions, feel free to contact technical support.</p>
      <p>Thanks, <br> The MMMK Team</p>
    </div>
  </div>
</body>
</html>`
    );

    res.status(200).json({
      success: true,
      message: "Password reset link has been sent to the registered admin email",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    const resetToken = await ResetToken.findOne({ token, onModel: "Admin" });

    if (!resetToken) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const admin = await Admin.findById(resetToken.userId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // updating password
    admin.password = password; // The pre-save hook will hash it
    await admin.save();

    // deleting reset token
    await ResetToken.findByIdAndDelete(resetToken._id);

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the password",
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Find the admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Check if account is locked
    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((admin.lockUntil - Date.now()) / (60 * 1000));
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed attempts. Try again in ${remainingMinutes} minutes.`,
      });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      // Increment login attempts
      admin.loginAttempts += 1;
      
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = Date.now() + 60 * 60 * 1000; // Lock for 1 hour
        await admin.save();
        return res.status(403).json({
          success: false,
          message: "Too many failed attempts. Account locked for 1 hour.",
        });
      }
      
      await admin.save();
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Reset attempts on successful login
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    await admin.save();

    // Generate a token
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: "admin" },
      process.env.SECRET_KEY,
      {
        expiresIn: "8h",
      }
    );

    // Set token in cookie
    res.cookie("adminAuthToken", token, getAdminCookieOptions());

    // Send login notification
    const authorizedEmail = process.env.ADMIN_RESET_EMAIL;
    if (authorizedEmail) {
      const loginTime = new Date().toLocaleString();
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      
      sendMail(
        authorizedEmail,
        "Security Alert: Admin Login Detected",
        `A login to the admin panel was detected at ${loginTime} from IP: ${ip}. If this wasn't you, please secure your account immediately.`,
        `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #d9534f;">Security Alert: Admin Login</h2>
          <p>A successful login to the **MMMK Admin Panel** was detected.</p>
          <hr />
          <p><strong>Time:</strong> ${loginTime}</p>
          <p><strong>Username:</strong> ${admin.username}</p>
          <p><strong>IP Address:</strong> ${ip}</p>
          <hr />
          <p style="color: #777; font-size: 12px;">If this was you, you can safely ignore this email. If you do not recognize this activity, please reset your password immediately using the "Forgot Password" link on the login page.</p>
        </div>`
      ).catch(err => console.error("Failed to send login notification:", err));
    }

    // Respond with success message
    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data: {
        id: admin._id,
        username: admin.username,
        token,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while logging in",
    });
  }
};

const logout = async (req, res) => {
  try {
    // Set token in cookie
    res.clearCookie("adminAuthToken", {
      ...getAdminCookieOptions(),
      maxAge: undefined,
    });

    // Respond with success message
    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while logged out",
    });
  }
};

module.exports = { createAdmin, login, logout, forgotPassword, updatePassword };
