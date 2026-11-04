const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Configure public DNS resolvers to prevent Windows SRV lookup timeouts with Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

const exportDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is missing from backend/.env');
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const outDir = path.join(__dirname, '../backups/database_export');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections. Exporting to JSON...`);

    const combinedData = {};

    for (const col of collections) {
      if (col.name.startsWith('system.')) continue;

      const records = await db.collection(col.name).find({}).toArray();
      combinedData[col.name] = records;

      const filePath = path.join(outDir, `${col.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(records, null, 2), 'utf8');

      if (records.length > 0) {
        console.log(`✅ Exported ${col.name}: ${records.length} records`);
      }
    }

    // Save combined JSON with all collections
    const combinedFile = path.join(outDir, 'all_database_data.json');
    fs.writeFileSync(combinedFile, JSON.stringify(combinedData, null, 2), 'utf8');

    console.log('\n====================================================');
    console.log('🎉 Database export completed successfully!');
    console.log(`📁 Files saved in: ${outDir}`);
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
};

exportDatabase();

