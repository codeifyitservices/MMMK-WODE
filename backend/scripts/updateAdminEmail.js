const mongoose = require('mongoose');
const Admin = require('../Models/Admin');
const connectDB = require('../Config/db');
require('dotenv').config();

const updateAdminEmail = async () => {
  const username = process.argv[2] || 'admin';
  const email = process.argv[3];

  if (!email) {
    console.error('Please provide an email address. Usage: node updateAdminEmail.js <username> <email>');
    process.exit(1);
  }

  try {
    // Connect to database
    await connectDB();

    // Find the admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.error(`Admin with username "${username}" not found.`);
      await mongoose.connection.close();
      process.exit(1);
    }

    // Update email
    admin.email = email;
    await admin.save();
    console.log(`Successfully updated email for admin "${username}" to "${email}"`);
    
    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin email:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

updateAdminEmail();
