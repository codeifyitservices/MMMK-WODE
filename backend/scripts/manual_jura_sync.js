const mongoose = require('mongoose');
const { syncSpecificProductsToJura } = require('../services/jura.service');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../Config/db');

require('../Models/Category');

const namesToSync = [
  'MPony2', 'Majesty' // Only sync the missing ones to save time/bandwidth
];

async function run() {
  await connectDB();
  console.log('Connected to DB');
  
  await syncSpecificProductsToJura(namesToSync);
  
  console.log('Manual sync completed');
  process.exit(0);
}

run().catch(err => {
  
  process.exit(1);
});
