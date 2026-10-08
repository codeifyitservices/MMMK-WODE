const mongoose = require('mongoose');
const Admin = require('../Models/Admin');
const connectDB = require('../Config/db');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user
    const adminUser = new Admin({
      username: 'admin',
      password: 'admin',
      email: 'admin@example.com' // Default email, change as needed
    });

    // Save admin user
    await adminUser.save();
    console.log('Admin user created successfully!');
    
    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

createAdminUser();