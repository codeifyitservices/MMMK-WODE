const mongoose = require('mongoose');
const Admin = require('../Models/Admin');
const connectDB = require('../Config/db');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to database
    await connectDB();

    const username = 'superadmin';
    const password = 'superadmin@codenap1';
    const email = process.env.ADMIN_RESET_EMAIL || 'admin@example.com';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log(`Admin user "${username}" already exists! Updating password...`);
      existingAdmin.password = password;
      await existingAdmin.save();
      console.log('Password updated successfully.');
    } else {
      // Create admin user
      const adminUser = new Admin({
        username,
        password,
        email
      });

      // Save admin user
      await adminUser.save();
      console.log(`Admin user "${username}" created successfully!`);
    }
    
    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating superadmin:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

createSuperAdmin();
