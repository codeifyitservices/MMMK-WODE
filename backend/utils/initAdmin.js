const bcrypt = require("bcryptjs");
const Admin = require("../Models/Admin");

/**
 * Automatically ensures the primary admin account exists, is unlocked,
 * and has the current system credentials. This runs seamlessly on server startup
 * so any cPanel / VPS deployment automatically syncs credentials without manual intervention.
 */
const ensureAdminAccount = async () => {
  try {
    const targetUsername = "admin";
    const targetPassword = process.env.ADMIN_DEFAULT_PASSWORD || "admin@mmmk12";
    const defaultEmail = process.env.ADMIN_RESET_EMAIL || "jatinverma4554@gmail.com";

    let admin = await Admin.findOne({ username: targetUsername });

    if (!admin) {
      admin = new Admin({
        username: targetUsername,
        password: targetPassword,
        email: defaultEmail,
        loginAttempts: 0,
        lockUntil: undefined,
      });
      await admin.save();
      console.log(`[Admin Setup] ✅ Admin "${targetUsername}" created successfully.`);
    } else {
      const isPasswordMatch = await bcrypt.compare(targetPassword, admin.password);
      const isLocked = Boolean(admin.lockUntil && admin.lockUntil > Date.now());
      const hasFailedAttempts = (admin.loginAttempts || 0) > 0;

      if (!isPasswordMatch || isLocked || hasFailedAttempts) {
        admin.password = targetPassword; // Pre-save hook will hash it with bcrypt
        admin.loginAttempts = 0;
        admin.lockUntil = undefined;
        if (!admin.email && defaultEmail) {
          admin.email = defaultEmail;
        }
        await admin.save();
        console.log(`[Admin Setup] ✅ Admin "${targetUsername}" credentials synced & account unlocked.`);
      }
    }
  } catch (error) {
    console.error("[Admin Setup] ⚠️ Non-blocking admin init error:", error.message);
  }
};

module.exports = { ensureAdminAccount };

