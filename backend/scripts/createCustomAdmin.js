const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Admin = require('../Models/Admin');
const connectDB = require('../Config/db');

const setAdminCredentials = async (username, password, email) => {
  if (!username || !password) {
    console.error('Usage: node scripts/createCustomAdmin.js <username> <password> [email]');
    process.exit(1);
  }

  try {
    await connectDB();

    const targetEmail = email || process.env.ADMIN_RESET_EMAIL || 'admin@mmmk-wode.com';
    const existingAdmin = await Admin.findOne({ username });

    if (existingAdmin) {
      console.log(`Admin user "${username}" found. Updating password and unlocking account...`);
      existingAdmin.password = password;
      existingAdmin.email = targetEmail;
      existingAdmin.loginAttempts = 0;
      existingAdmin.lockUntil = undefined;
      await existingAdmin.save();
      console.log(`✅ Admin user "${username}" updated successfully!`);
    } else {
      console.log(`Admin user "${username}" does not exist. Creating new admin user...`);
      const newAdmin = new Admin({
        username,
        password,
        email: targetEmail,
        loginAttempts: 0
      });
      await newAdmin.save();
      console.log(`✅ Admin user "${username}" created successfully!`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin credentials:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const username = args[0];
  const password = args[1];
  const email = args[2];

  if (!username || !password) {
    console.log('Usage: node scripts/createCustomAdmin.js <username> <password> [email]');
    process.exit(1);
  }

  setAdminCredentials(username, password, email);
} else {
  module.exports = setAdminCredentials;
}
