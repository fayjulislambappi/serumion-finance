const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dns = require('dns');

// Override default DNS servers on Windows to handle MongoDB Atlas DNS SRV lookups (_mongodb._tcp)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('DNS server override notice:', dnsErr.message);
}

let mongoServer = null;

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  if (mongoUri && mongoUri.trim() !== '') {
    try {
      console.log(`⚡ Connecting to configured MongoDB Atlas / Instance...`);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`🚀 MongoDB Atlas Connected Successfully: ${conn.connection.host} / Database: ${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.error(`⚠️ Could not connect to MONGODB_URI (${error.message}).`);
      console.log('⚡ Launching embedded MongoMemoryServer for development fallback...');
    }
  }

  try {
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    console.log(`✅ Embedded MongoMemoryServer active at: ${mongoUri}`);

    const conn = await mongoose.connect(mongoUri);
    console.log(`🚀 MongoDB Connected (Embedded): ${conn.connection.host} / Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ Embedded MongoDB Startup Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
