const mongoose = require('mongoose');
require('dotenv').config();

const backup = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections. Starting export...`);
    
    const fs = require('fs');
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups');
    }

    for (const col of collections) {
      console.log(`Exporting ${col.name}...`);
      const data = await db.collection(col.name).find({}).toArray();
      fs.writeFileSync(`./backups/${col.name}.json`, JSON.stringify(data, null, 2));
    }
    
    console.log('Backup complete! Files are in the /backups folder.');
    process.exit(0);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
};

backup();
