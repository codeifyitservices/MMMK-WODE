const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../Config/db');

require('../Models/Category');
const Product = require('../Models/Product');

const namesToSync = [
  'ME12', 'ME13', 'ME14', 'ME15', 'ME16', 'MEY', 'MPony1', 'Mpony-2', 'MElly', 'mejesty', 'miel', 'mada'
];

async function run() {
  await connectDB();
  
  const regexNames = namesToSync.map(n => new RegExp('^' + n.trim() + '$', 'i'));
  const foundProducts = await Product.find({'productName.en': { $in: regexNames }});
  
  const foundNames = foundProducts.map(p => p.productName?.en?.toLowerCase() || '');
  const missing = namesToSync.filter(n => !foundNames.includes(n.trim().toLowerCase()));
  
  console.log('Missing products:', missing);
  console.log('Found names in DB:', foundNames);
  
  // also let's just do a generic search to see if they are spelled slightly differently
  for (const m of missing) {
     const similar = await Product.find({'productName.en': { $regex: new RegExp(m, 'i') }});
     if (similar.length > 0) {
       console.log(`Did you mean "${similar[0].productName.en}" instead of "${m}"?`);
     }
  }
  
  process.exit(0);
}

run().catch(console.error);
